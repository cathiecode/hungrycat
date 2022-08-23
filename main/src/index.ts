import fetch, { Response } from "node-fetch";
import {
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  isAfter,
  isBefore,
  subHours,
} from "date-fns";
import { readFileSync } from "node:fs";

export type MessageType = "TIMEOUT" | "NOTIFY_ERROR";

export type Message = {
  type: MessageType;
  service: string;
  date: Date;
};

export interface Notifier {
  notify(message: Message): Promise<void>;
}

export interface Checker {
  check(): Promise<boolean>;
}

export type ServiceLogLineType = "LIVING" | "DEAD" | "DYING";

export type ServiceLogLine = {
  type: ServiceLogLineType;
  date: Date;
};

export interface ServiceLogs {
  findByDate(
    service: string,
    since: Date,
    until?: Date
  ): Promise<ServiceLogLine[]>;
}

export interface ServiceLogger {
  logLiving(service: string, date: Date): void;
  logDead(service: string, date: Date): void;
  logDying(service: string, date: Date): void;
}

export default class MockNotifier implements Notifier {
  async notify(message: Message) {
    console.log(message);
  }
}

class DiscordWebhookNotifier implements Notifier {
  constructor(private webhook_url: string) {}

  async notify(message: Message) {
    const stringMessage = [
      "```",
      JSON.stringify(message, null, "    "),
      "```",
    ].join("\n");

    await fetch(this.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: stringMessage,
      }),
    });
  }
}

class HTTPGetStatusChecker implements Checker {
  constructor(private url: string) {}

  async check(): Promise<boolean> {
    try {
      const response = await fetch(this.url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

abstract class BaseServiceLogs implements ServiceLogger {
  logLiving(service: string, date: Date): void {
    this.log(service, { type: "LIVING", date: date });
  }
  logDead(service: string, date: Date): void {
    this.log(service, { type: "DEAD", date: date });
  }
  logDying(service: string, date: Date): void {
    this.log(service, { type: "DYING", date: date });
  }

  protected abstract log(service: string, data: ServiceLogLine): void;
}

export class VolatileMemoryServiceLogs
  extends BaseServiceLogs
  implements ServiceLogs, ServiceLogger
{
  private serviceLogs: Map<string, ServiceLogLine[]> = new Map();

  async findByDate(
    service: string,
    since: Date,
    until?: Date | undefined
  ): Promise<ServiceLogLine[]> {
    const log = this.serviceLogs.get(service);
    if (!log) {
      return [];
    }
    return log.filter(
      (line) =>
        isAfter(line.date, since) &&
        (until === undefined || isBefore(line.date, until))
    );
  }

  protected log(service: string, data: ServiceLogLine): void {
    if (Math.random() < 0.1) {
      this.rotate(data.date);
    }
    const existingLog = this.serviceLogs.get(service);
    if (existingLog) {
      existingLog.push(data);
    } else {
      this.serviceLogs.set(service, [data]);
    }
  }

  private rotate(date: Date) {
    for (let log of this.serviceLogs.values()) {
      log.filter((logLine) => isBefore(logLine.date, subHours(date, 1)));
    }
  }
}

export class ConsoleServiceLogs extends VolatileMemoryServiceLogs {
  protected log(service: string, data: ServiceLogLine) {
    console.log(`[${service}]: ${JSON.stringify(data)}`);
    super.log(service, data);
  }
}

export interface Cat {
  check(date: Date): void;
  getName(): string;
  checkIntervalMS(): number;
  isAlive(date: Date): boolean;
}

export class PassiveCat implements Cat {
  private lastFeedDate: Date;
  private lastReportDate: Date | undefined;
  constructor(
    private name: string,
    private toleranceDurationMS: number,
    private reminderDurationMS: number,
    startDate: Date,
    private notifier: Notifier,
    private serviceLogs: ServiceLogger
  ) {
    this.lastFeedDate = startDate;
  }

  feed(date: Date) {
    this.lastFeedDate = date;
    this.serviceLogs.logLiving(this.getName(), date);
  }

  check(date: Date) {
    if (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    ) {
      return;
    }
    this.serviceLogs.logDead(this.getName(), date);
    if (
      differenceInMilliseconds(date, this.lastReportDate ?? 0) <
      this.reminderDurationMS
    ) {
      return;
    }
    this.lastReportDate = date;
    this.notifier
      .notify({ type: "TIMEOUT", service: this.name, date: date })
      .catch((e) =>
        this.notifier.notify({
          type: "NOTIFY_ERROR",
          service: this.name,
          date: date,
        })
      );
  }

  getName(): string {
    return this.name;
  }

  checkIntervalMS(): number {
    return this.toleranceDurationMS / 2;
  }

  isAlive(date: Date): boolean {
    return (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    );
  }
}

export class ActiveCat<T extends Checker> implements Cat {
  private lastFeedDate: Date;
  private lastReportDate: Date | undefined;
  constructor(
    private name: string,
    private toleranceDurationMS: number,
    private reminderDurationMS: number,
    startDate: Date,
    private checker: T,
    private notifier: Notifier,
    private serviceLogs: ServiceLogger
  ) {
    this.lastFeedDate = startDate;
  }

  async check(date: Date) {
    if (await this.checker.check()) {
      this.serviceLogs.logLiving(this.getName(), date);
      this.lastFeedDate = date;
    } else {
      this.serviceLogs.logDying(this.getName(), date);
    }
    if (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    ) {
      return;
    }
    this.serviceLogs.logDead(this.getName(), date);
    if (
      differenceInMilliseconds(date, this.lastReportDate ?? 0) <
      this.reminderDurationMS
    ) {
      return;
    }
    this.lastReportDate = date;
    this.notifier
      .notify({ type: "TIMEOUT", service: this.name, date: date })
      .catch(() =>
        this.notifier.notify({
          type: "NOTIFY_ERROR",
          service: this.name,
          date: date,
        })
      );
  }

  getName(): string {
    return this.name;
  }

  checkIntervalMS(): number {
    return this.toleranceDurationMS / 2;
  }

  isAlive(date: Date): boolean {
    return (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    );
  }
}

import url from "url";
import Fastify from "fastify";
import { fastifyRequestContextPlugin } from "@fastify/request-context";
import fastifyStatic from "@fastify/static";
import path from "node:path";

type ServiceConfig =
  | {
      type: "passive";
      name: string;
      duration: number;
      reminderDuration?: number;
    }
  | {
      type: "active";
      name: string;
      duration: number;
      reminderDuration?: number;
      check_endpoint: string;
    };

type Config = {
  version: 0;
  services: ServiceConfig[];
  http_token: string;
  discord_webhook: string;
};

const self = url.fileURLToPath(import.meta.url);

if (process.argv[1] === self) {
  const serviceLogs = new ConsoleServiceLogs();
  const config: Config = JSON.parse(
    readFileSync(process.argv[2]).toString("utf-8")
  );

  const passiveCats: PassiveCat[] = [];
  const activeCats: ActiveCat<HTTPGetStatusChecker>[] = [];
  const cats: Cat[] = [];

  config.services.forEach((serviceConfig) => {
    let cat: Cat;

    switch (serviceConfig.type) {
      case "passive":
        const passiveCat = new PassiveCat(
          serviceConfig.name,
          serviceConfig.duration,
          serviceConfig.reminderDuration ?? 1000 * 60 * 60,
          new Date(),
          new DiscordWebhookNotifier(config.discord_webhook),
          serviceLogs
        );
        cat = passiveCat;
        passiveCats.push(passiveCat);
        break;
      case "active":
        const activeCat = new ActiveCat(
          serviceConfig.name,
          serviceConfig.duration,
          serviceConfig.reminderDuration ?? 1000 * 60 * 60,
          new Date(),
          new HTTPGetStatusChecker(serviceConfig.check_endpoint),
          new DiscordWebhookNotifier(config.discord_webhook),
          serviceLogs
        );
        cat = activeCat;
        activeCats.push(activeCat);
        break;
      default: // Fallback
        throw new Error("Undefined cat type " + (serviceConfig as any).type);
    }

    cats.push(cat);

    setInterval(() => {
      cat.check(new Date());
    }, cat.checkIntervalMS());
  });

  console.log(cats.length, "cat(s) loaded");

  const fastify = Fastify();

  type Capability = "GET_LOG" | "HEARTBEAT" | "LIST_SERVICE";

  fastify.register(fastifyRequestContextPlugin, {
    hook: "onRequest",
    defaultStoreValues: {
      capability: [] as Capability[],
    },
  });

  fastify.register(
    function (instance, options, done) {
      instance.register(fastifyStatic, {
        root: path.join(
          path.dirname(new URL(import.meta.url).pathname),
          "public",
          "ui"
        ),
      });
      instance.setNotFoundHandler((request, reply) => {
        reply.sendFile("index.html");
      });
      done();
    },
    { prefix: "/ui" }
  );

  fastify.listen({ port: parseInt(process.env.PORT ?? "80") });

  fastify.addHook("onRequest", (request, reply, done) => {
    try {
      const authHeader = request.headers["authorization"];
      if (typeof authHeader !== "string") {
        done();
        return;
      }
      const authHeaderSections = authHeader.split(" ");
      if (
        authHeaderSections.length !== 2 ||
        authHeaderSections[0] !== "Bearer"
      ) {
        done();
        return;
      }
      const token = authHeaderSections[1];
      if (token !== config.http_token) {
        done();
        return;
      }
      request.requestContext.set("capability", [
        ...request.requestContext.get("capability"),
        "GET_LOG",
        "HEARTBEAT",
        "LIST_SERVICE",
      ]);
      done();
    } catch (e) {
      console.error(e);
      done();
    }
  });

  fastify.get("/service", async (request, reply) => {
    if (!request.requestContext.get("capability").includes("LIST_SERVICE")) {
      reply.code(401);
      return {
        ok: false,
        error: "Unauthorized",
      };
    }
    return {
      ok: true,
      services: cats.map((cat) => ({
        name: cat.getName(),
        status: cat.isAlive(new Date()),
      })),
    };
  });

  fastify.post("/service/:service/hb", (request, reply) => {
    if (!request.requestContext.get("capability").includes("HEARTBEAT")) {
      reply.code(401);
      return {
        ok: false,
        error: "Unauthorized",
      };
    }
    const params = request.params as Record<"service", string>;
    const cat = passiveCats.find((cat) => cat.getName() === params.service);

    if (cat === undefined) {
      reply.code(404);
      return {
        ok: false,
      };
    }
    cat.feed(new Date());
    return {
      ok: true,
    };
  });

  fastify.get("/service/:service/logs", async (request, reply) => {
    if (!request.requestContext.get("capability").includes("GET_LOG")) {
      reply.code(401);
      return {
        ok: false,
        error: "Unauthorized",
      };
    }
    const params = request.params as Record<"service", string>;
    const query = request.query as Record<"since" | "until", unknown>;
    if (typeof query.since !== "string" || typeof query.until !== "string") {
      reply.code(400);
      return {
        ok: false,
        error: "Query 'since' and 'until' are required",
      };
    }
    const since = parseInt(query.since);
    const until = parseInt(query.until);

    const logs = await serviceLogs.findByDate(
      params.service,
      fromUnixTime(since),
      fromUnixTime(until)
    );
    return {
      ok: true,
      logs: logs.map((log) => ({
        type: log.type,
        date: getUnixTime(log.date),
      })),
    };
  });

  fastify.get("/token/:token/capability", (request, reply) => {
    const params = request.params as Record<"token", string>;

    if (params.token !== config.http_token) {
      reply.code(404);
      return {
        ok: false,
        error: "No such token",
      };
    }

    if (
      params.token !==
      request.headers["authorization"]?.slice("Bearer ".length).trim()
    ) {
      reply.code(403);
      return {
        ok: false,
        error: "Invalid token access",
      };
    }
    return {
      ok: true,
      capability: request.requestContext.get("capability"),
    };
  });
}
