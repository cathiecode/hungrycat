import { useRecoilValue } from "recoil";
import { apiKeyState } from "../../atoms";
import useSWR from "swr";
import { query } from "../../api";
import { useIsCapable, useSignInRoute } from "../../hooks";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusHistoryLines from "../models/log/StatusHistoryLines";
import { fromUnixTime, getUnixTime, sub } from "date-fns";
import StatusHistoryBox from "../models/log/StatusHistoryBox";

const HistoryLine = ({ service }: { service: string }) => {
  const apiKey = useRecoilValue(apiKeyState);

  const [until, setUntil] = useState(new Date());

  const since = sub(until, { hours: 1 });

  useEffect(() => {
    const timer = setInterval(() => {
      setUntil(new Date());
    }, 1000 * 60 * 10);

    return () => {
      clearInterval(timer);
    };
  }, [setUntil]);

  const { data: state } = useSWR(
    apiKey && [
      `/service/${service}/logs?since=${getUnixTime(since)}&until=${getUnixTime(
        until
      )}`,
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

  return (
    <div className="w-48">
      <StatusHistoryLines log={log} since={since} until={until} />
    </div>
  );
};

export default function Dashboard() {
  const apiKey = useRecoilValue(apiKeyState);

  useSignInRoute();

  const { data: state } = useSWR(apiKey && ["/service", apiKey], query);

  return (
    <table className="w-full">
      <thead>
        <tr>
          <td>History</td>
          <td>Name</td>
          <td>isAlive</td>
        </tr>
      </thead>
      <tbody>
        {state &&
          state.services.map((service: { name: string; status: boolean }) => (
            <tr key={service.name}>
              <td>
                <HistoryLine service={service.name} />
              </td>
              <th>
                <Link to={`/service/${service.name}`}>{service.name}</Link>
              </th>
              <td>{service.status ? "Running" : "Dead"}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
