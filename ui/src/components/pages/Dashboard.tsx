import { useRecoilValue } from "recoil";
import { apiKeyState } from "../../atoms";
import useSWR from "swr";
import { query } from "../../api";
import { useIsCapable, useSignInRoute } from "../../hooks";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const apiKey = useRecoilValue(apiKeyState);

  useSignInRoute();

  const { data: state } = useSWR(apiKey && ["/service", apiKey], query);
  return (
    <table>
      <thead>
        <tr>
          <td>Name</td>
          <td>isAlive</td>
        </tr>
      </thead>
      <tbody>
        {state &&
          state.services.map((service: { name: string; status: boolean }) => (
            <tr>
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
