import { useEffect, useState } from "react";
import api from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  async function load() {
    const res = await api.get("/admin/users");
    setUsers(res.data.users);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(user) {
    const role = user.role === "admin" ? "donor" : "admin";
    await api.patch(`/admin/users/${user.id}/role`, { role });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="text-ink/50">
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-ink/10">
              <td className="py-3">{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => toggle(user)} className="text-pine">
                  Switch role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
