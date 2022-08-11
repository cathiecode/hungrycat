import { fromUnixTime } from "date-fns";
import MockNotifier, {
  ActiveCat,
  Message,
  PassiveCat,
  VolatileMemoryServiceLogs,
} from "./index";
import { jest } from "@jest/globals";

test("生まれてからtorelanceDurationMS経過した後に空腹に気がついてNotifierを呼ぶ", () => {
  const notify = jest.fn(async (message: Message) => {});

  const toleranceSeconds = 60;

  const cat = new PassiveCat(
    "test cat",
    toleranceSeconds * 1000,
    0,
    fromUnixTime(1659074852),
    { notify },
    new VolatileMemoryServiceLogs()
  );

  cat.check(fromUnixTime(1659074852 + toleranceSeconds / 2));
  expect(notify.mock.calls.length).toBe(0);

  cat.check(fromUnixTime(1659074852 + toleranceSeconds * 2));
  expect(notify.mock.calls.length).toBe(1);
});

test("空腹に気がついてNotifierを呼んだあとREMINDER_DURATION経過してからもう一度Notifierを呼ぶ", () => {
  const notify = jest.fn(async (message: Message) => {});

  const toleranceSeconds = 60;
  const reminderDuration = 120;

  const cat = new PassiveCat(
    "test cat",
    toleranceSeconds * 1000,
    reminderDuration * 1000,
    fromUnixTime(1659074852),
    { notify },
    new VolatileMemoryServiceLogs()
  );

  cat.check(fromUnixTime(1659074852 + toleranceSeconds * 2));
  expect(notify.mock.calls.length).toBe(1);

  cat.check(
    fromUnixTime(1659074852 + toleranceSeconds * 2 + reminderDuration / 2)
  );
  expect(notify.mock.calls.length).toBe(1);

  cat.check(
    fromUnixTime(1659074852 + toleranceSeconds * 2 + reminderDuration * 2)
  );
  expect(notify.mock.calls.length).toBe(2);
});

test("生まれてからtorelanceDurationMS経過した後に空腹に気がついてServiceLogger#deadを呼ぶ", () => {
  const logDead = jest.fn(() => {});

  const toleranceSeconds = 60;

  const cat = new PassiveCat(
    "test cat",
    toleranceSeconds * 1000,
    0,
    fromUnixTime(1659074852),
    new MockNotifier(),
    { logDead, logLiving: () => {}, logDying: () => {} }
  );

  cat.check(fromUnixTime(1659074852 + toleranceSeconds / 2));
  expect(logDead.mock.calls.length).toBe(0);

  cat.check(fromUnixTime(1659074852 + toleranceSeconds * 2));
  expect(logDead.mock.calls.length).toBe(1);
});

test("生まれてからtorelanceDurationMS経過した後にチェックしてダウンしていたらNotifierを呼ぶ", async () => {
  const notify = jest.fn(async (message: Message) => {});

  const toleranceSeconds = 60;

  const cat = new ActiveCat(
    "test cat",
    toleranceSeconds * 1000,
    0,
    fromUnixTime(1659074852),
    { check: async () => false },
    { notify },
    new VolatileMemoryServiceLogs()
  );

  await cat.check(fromUnixTime(1659074852 + toleranceSeconds / 2));
  expect(notify.mock.calls.length).toBe(0);

  await cat.check(fromUnixTime(1659074852 + toleranceSeconds * 2));
  expect(notify.mock.calls.length).toBe(1);
});

test("生まれてからtorelanceDurationMS経過した後にチェックしてダウンしていたらServiceLogger#deadを呼ぶ", async () => {
  const logDead = jest.fn(() => {});

  const toleranceSeconds = 60;

  const cat = new ActiveCat(
    "test cat",
    toleranceSeconds * 1000,
    0,
    fromUnixTime(1659074852),
    { check: async () => false },
    new MockNotifier(),
    { logDead, logLiving: () => {}, logDying: () => {} }
  );

  await cat.check(fromUnixTime(1659074852 + toleranceSeconds / 2));
  expect(logDead.mock.calls.length).toBe(0);

  await cat.check(fromUnixTime(1659074852 + toleranceSeconds * 2));
  expect(logDead.mock.calls.length).toBe(1);
});
