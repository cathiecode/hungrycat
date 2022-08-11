import { useContext } from "react";
import { Outlet } from "react-router";

export default function Page() {
  return (
    <div className="flex flex-col absolute w-full h-full overflow-hidden">
      <div className="flex p-3 shadow">
        <div className="flex-1">HungryCat GUI</div>
        <div>a</div>
      </div>
      <div className="flex grow shrink flex-auto overflow-hidden">
        <div className="p-3 border-x border-gray"></div>
        <div className="p-3 flex-auto h-auto overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
