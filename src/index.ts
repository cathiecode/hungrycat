import fetch, { Response } from "node-fetch";
import { differenceInMilliseconds } from "date-fns";
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

export interface Cat {
  check(date: Date): void;
  getName(): string;
}

export class PassiveCat implements Cat {
  private lastFeedDate: Date;
  private lastReportDate: Date | undefined;
  constructor(
    private name: string,
    private toleranceDurationMS: number,
    private reminderDurationMS: number,
    startDate: Date,
    private notifier: Notifier
  ) {
    this.lastFeedDate = startDate;
  }

  feed(date: Date) {
    this.lastFeedDate = date;
  }

  check(date: Date) {
    if (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    ) {
      return;
    }
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
    private notifier: Notifier
  ) {
    this.lastFeedDate = startDate;
  }

  async check(date: Date) {
    if (await this.checker.check()) {
      this.lastFeedDate = date;
    }
    if (
      differenceInMilliseconds(date, this.lastFeedDate) <
      this.toleranceDurationMS
    ) {
      return;
    }
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
}

import url from "url";
import Fastify from "fastify";

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
  discord_webhook: string;
};

const self = url.fileURLToPath(import.meta.url);

if (process.argv[1] === self) {
  const config: Config = JSON.parse(
    readFileSync(process.argv[2]).toString("utf-8")
  );

  const passiveCats: PassiveCat[] = [];
  const activeCats: ActiveCat<HTTPGetStatusChecker>[] = [];
  const cats: Cat[] = [];

  config.services.forEach((serviceConfig) => {
    const serviceInterval = serviceConfig.duration / 2;

    let cat: Cat;

    switch (serviceConfig.type) {
      case "passive":
        const passiveCat = new PassiveCat(
          serviceConfig.name,
          serviceConfig.duration,
          serviceConfig.reminderDuration ?? 1000 * 60 * 60,
          new Date(),
          new DiscordWebhookNotifier(config.discord_webhook)
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
          new DiscordWebhookNotifier(config.discord_webhook)
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
    }, serviceInterval);
  });

  console.log(cats.length, "cat(s) loaded");

  const fastify = Fastify();
  fastify.listen({ port: parseInt(process.env.PORT ?? "80") });

  fastify.post("/hb/:service", (request, reply) => {
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
}
