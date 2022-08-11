import Tippy from "@tippyjs/react";
import { differenceInMilliseconds } from "date-fns";
import { memo, ReactNode } from "react";
import "tippy.js/dist/tippy.css";

type Status = "LIVING" | "DEAD" | "DYING";

type StatusHistoryProps = {
  log?: {
    date: Date;
    type: Status;
  }[];
  since: Date;
  until: Date;
  className?: string;
};

const StatusHistoryLines = memo(
  ({ log, since, until, className }: StatusHistoryProps) => {
    const logColor: Record<Status, string> = {
      LIVING: "#4ff764",
      DEAD: "#f0715b",
      DYING: "#f7ba4f",
    };

    const viewDurationMS = differenceInMilliseconds(until, since);

    return (
      <div className={`${className} relative h-10 overflow-hidden`}>
        {log ? (
          log.map((logLine) => (
            <Tippy
              key={`${logLine.date}_${logLine.type}`}
              content={
                <div>
                  <div>{logLine.type}</div>
                  <div>{logLine.date.toLocaleString()}</div>
                </div>
              }
            >
              <div
                className={`absolute w-1 h-full top-0 rounded`}
                style={{
                  left: `${
                    (differenceInMilliseconds(logLine.date, since) /
                      viewDurationMS) *
                    100
                  }%`,

                  backgroundColor: logColor[logLine.type],
                }}
              />
            </Tippy>
          ))
        ) : (
          <div className="w-full h-full bg-slate-100"></div>
        )}
      </div>
    );
  }
);

export default StatusHistoryLines;
