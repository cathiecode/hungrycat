import fetch from "node-fetch";
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

class DiscordWebhookNotifier implements Notifier {
  constructor(private webhook_url: string) {}

  async notify(message: Message) {
    console.log(
      "notify",
      message.type,
      "from",
      message.service,
      "via",
      this.webhook_url
    );
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

export class Cat {
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
    console.log(this.lastReportDate);
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

import url from "url";
import Fastify from "fastify";

const self = url.fileURLToPath(import.meta.url);

if (process.argv[1] === self) {
  const config = JSON.parse(readFileSync(process.argv[2]).toString("utf-8"));

  let interval = 60 * 1000;
  const cats: Cat[] = [];

  config.services.forEach(
    (serviceConfig: {
      name: string;
      duration: number;
      reminderDuration?: number;
    }) => {
      const serviceInterval = serviceConfig.duration / 2;
      if (serviceInterval < interval) {
        interval = serviceInterval;
      }
      cats.push(
        new Cat(
          serviceConfig.name,
          serviceConfig.duration,
          serviceConfig.reminderDuration ?? 1000 * 60 * 60,
          new Date(),
          new DiscordWebhookNotifier(config.discord_webhook)
        )
      );
    }
  );

  console.log("Interval set to", interval);
  console.log(cats.length, "cat(s) loaded");

  setInterval(() => {
    cats.forEach((cat) => {
      cat.check(new Date());
    });
  }, interval);

  const fastify = Fastify();
  fastify.listen({ port: parseInt(process.env.PORT ?? "80") });

  fastify.post("/hb/:service", (request, reply) => {
    const params = request.params as Record<"service", string>;
    const cat = cats.find((cat) => cat.getName() === params.service);

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
