import { useState } from "react";
import { useParams } from "react-router";
import { useRecoilValue } from "recoil";
import useSWR from "swr";
import { query } from "../../api";
import { apiKeyState } from "../../atoms";
import { useSignInRoute } from "../../hooks";
import { getUnixTime, subHours } from "date-fns";

export default function Service() {
  useSignInRoute();

  const params = useParams();

  const apiKey = useRecoilValue(apiKeyState);

  const [until, setUntil] = useState(new Date());

  const { data: state } = useSWR(
    apiKey && [
      `/service/${params.service}/logs?since=${getUnixTime(
        subHours(until, 1)
      )}&until=${getUnixTime(until)}`,
      apiKey,
    ],
    query
  );

  console.log(state);

  return (
    <div>
      <h1>{params.service}</h1>
      <table>
        <thead>
          <tr>
            <td>Date</td>
            <td>isAlive</td>
          </tr>
        </thead>
        <tbody>
          {state?.ok &&
            state.logs.map((log: any) => (
              <tr>
                <td>{log.date}</td>
                <td>{log.type}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
