import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import { query } from "../../api";
import { apiKeyState } from "../../atoms";
import { useBack, useSignInRoute } from "../../hooks";
import {
  add,
  format,
  formatDuration,
  fromUnixTime,
  getUnixTime,
  sub,
  subHours,
} from "date-fns";
import StatusHistoryLines from "../models/log/StatusHistoryLines";
import StatusHistoryBox from "../models/log/StatusHistoryBox";
import Button from "../ui/Button";
import {
  differenceInSeconds,
  formatDistance,
  hoursToMilliseconds,
  hoursToSeconds,
} from "date-fns/esm";

export default function Service() {
  useSignInRoute();

  const params = useParams();

  const apiKey = useRecoilValue(apiKeyState);

  const [until, setUntil] = useState(new Date());
  const [durationSeconds, setDurationSeconds] = useState(hoursToSeconds(1));

  const since = sub(until, { seconds: durationSeconds });

  const { data: state } = useSWR(
    apiKey && [
      `/service/${params.service}/logs?since=${getUnixTime(
        since
      )}&until=${getUnixTime(until)}`,
      apiKey,
    ],
    query
  );

  const log = useMemo(() => {
    if (!state) {
      return undefined;
    }
    return state.logs.map((logLine: any) => ({
      type: logLine.type,
      date: fromUnixTime(logLine.date),
    }));
  }, [state]);

  const handleOffsetClicked = useCallback(
    (ev: SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
      const offsetRatio = parseFloat(ev.currentTarget.dataset.offset!);
      const offset = differenceInSeconds(until, since) * offsetRatio;
      setUntil((current) => add(current, { seconds: offset }));
    },
    [since, until]
  );

  const handleScaleClicked = useCallback(
    (ev: SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
      const scaleRatio = parseFloat(ev.currentTarget.dataset.scale!);

      setDurationSeconds((current) => current * scaleRatio);
    },
    [since, until]
  );

  const back = useBack();

  return (
    <div>
      <button onClick={back}>←</button>
      <h1>{params.service}</h1>
      <StatusHistoryBox>
        <StatusHistoryLines log={log} until={until} since={since} />
      </StatusHistoryBox>
      <div className="flex mt-3 justify-center gap-4 text-gray-400">
        <button onClick={handleOffsetClicked} data-offset="-1">
          {"<<"}
        </button>
        <button onClick={handleOffsetClicked} data-offset="-0.1">
          {"<"}
        </button>
        <button onClick={handleScaleClicked} data-scale="10">
          {"-"}
        </button>
        {formatDistance(until, since)} since {since.toLocaleString()}
        <button onClick={handleScaleClicked} data-scale="0.1">
          {"+"}
        </button>
        <button onClick={handleOffsetClicked} data-offset="+0.1">
          {">"}
        </button>
        <button onClick={handleOffsetClicked} data-offset="+1">
          {">>"}
        </button>
      </div>
    </div>
  );
}
