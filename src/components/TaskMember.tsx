import { FaModx } from "react-icons/fa";
import { IUser } from "../types/global";

export const TaskMember = ({ member }: { member: IUser }) => {
  return (
    <div className="flex items-center gap-2">
      {member.profile ? (
        <img
          className="rounded-full size-[3.6rem] ring-1 ring-slate-200"
          src={`http://localhost:5050/uploads/users/profiles/${member.profile}`}
          alt="profile"
        />
      ) : (
        <p className="rounded-full size-[3.6rem] ring-1 ring-slate-200 bg-gray-100 animate-pulse"></p>
      )}
      <p className="font-semibold text-slate-700 text-[1rem] flex items-center gap-1">
        <span className="">{member.name}</span>
        <span className="relative top-[-.4rem]">
          <FaModx />
        </span>
      </p>
    </div>
  );
};
