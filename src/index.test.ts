import { fromUnixTime } from "date-fns";
import { Message, Cat } from "./index";
import { jest } from "@jest/globals";

test("生まれてからtorelanceDurationMS経過した後に空腹に気がついてNotifierを呼ぶ", () => {
  const notify = jest.fn(async (message: Message) => {});

  const toleranceSeconds = 60;

  const cat = new Cat(
    "test cat",
    toleranceSeconds * 1000,
    0,
    fromUnixTime(1659074852),
    { notify }
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

  const cat = new Cat(
    "test cat",
    toleranceSeconds * 1000,
    reminderDuration * 1000,
    fromUnixTime(1659074852),
    { notify }
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
