"use client";

import { useCallback, useEffect, useState } from 'react';
import { Users, Search, Filter, Lock, Unlock, ShieldAlert, CheckCircle2, User as UserIcon, Plus, Save, X, Loader2, Eye } from 'lucide-react';
import { adminUsersApi } from '@/services/api';

const roleLabels = {
  STUDENT: 'Sinh viên',
  DRIVER: 'Tài xế',
  CONDUCTOR: 'Phụ xe',
  DISPATCHER: 'Điều phối',
  ADMIN: 'Quản trị',
};

const emptyAccount = {
  fullName: '',
  email: '',
  password: '',
  role: 'DRIVER',
  employeeCode: '',
  licenseNumber: '',
  phoneNumber: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState(emptyAccount);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminUsersApi.list({
        keyword: searchTerm.trim(),
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    const handle = window.setTimeout(loadUsers, 250);
    return () => window.clearTimeout(handle);
  }, [loadUsers]);

  const handleToggleLock = async (user) => {
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      const nextStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
      const updated = await adminUsersApi.updateStatus(user.userId, {
        status: nextStatus,
        lockReason: nextStatus === 'LOCKED' ? 'Admin locked from UniBus web console' : '',
      });
      setUsers((current) => current.map((item) => item.userId === updated.userId ? updated : item));
      setNotice(nextStatus === 'LOCKED' ? `Đã khóa ${updated.email}.` : `Đã mở khóa ${updated.email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setIsMutating(true);
    setError('');
    setNotice('');
    try {
      const created = await adminUsersApi.create({
        ...newAccount,
        employeeCode: newAccount.employeeCode || null,
        licenseNumber: newAccount.licenseNumber || null,
        phoneNumber: newAccount.phoneNumber || null,
      });
      setUsers((current) => [created, ...current]);
      setNewAccount(emptyAccount);
      setIsAddModalOpen(false);
      setNotice(`Đã cấp tài khoản ${created.email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-primary" /> Quản lý Tài khoản
          </h1>
          <p className="text-brand-text/60 font-medium">Tìm kiếm, tra cứu thông tin và quản lý trạng thái tài khoản người dùng.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-text text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Cấp tài khoản
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-success">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">
          {error}
        </div>
      )}

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 border-b border-black/5 bg-brand-surface/30 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="relative w-full md:w-1/2 xl:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã số, email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="DRIVER">Tài xế</option>
              <option value="CONDUCTOR">Phụ xe</option>
              <option value="DISPATCHER">Điều phối</option>
              <option value="ADMIN">Quản trị</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary cursor-pointer shadow-sm"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
            <button onClick={loadUsers} className="bg-white border border-black/5 p-3 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Người dùng</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Liên hệ</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Vai trò</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b">Trạng thái</th>
                <th className="p-4 md:px-8 py-5 text-xs font-black text-brand-text/50 uppercase tracking-wider border-b text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-brand-text/50 font-bold">
                    <span className="inline-flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Đang tải tài khoản...</span>
                  </td>
                </tr>
              )}

              {!isLoading && users.map((user) => (
                <tr key={user.userId} className={`border-b border-black/5 transition-colors hover:bg-brand-surface/30 ${user.status === 'LOCKED' ? 'bg-brand-danger/5' : ''}`}>
                  <td className="p-4 md:px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.role === 'STUDENT' ? 'bg-brand-primary/20 text-brand-primary' : user.role === 'DRIVER' ? 'bg-brand-text/10 text-brand-text' : 'bg-brand-secondary/20 text-brand-secondary'}`}>
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-brand-text">{user.fullName}</div>
                        <div className="text-xs font-bold text-brand-text/50">USER-{user.userId}{user.staffCode ? ` • ${user.staffCode}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    <div className="text-sm font-medium">{user.email}</div>
                    <div className="text-xs font-bold text-brand-text/40 mt-1">{user.phoneNumber || 'Chưa có SĐT'}</div>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${user.role === 'STUDENT' ? 'bg-brand-primary/10 text-brand-primary' : user.role === 'DRIVER' ? 'bg-brand-text/10 text-brand-text' : 'bg-brand-secondary/10 text-brand-secondary'}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="p-4 md:px-8 py-4">
                    {user.status === 'ACTIVE' ? (
                      <div className="flex items-center gap-1.5 text-brand-success text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Hoạt động
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-brand-danger text-sm font-bold">
                        <ShieldAlert className="w-4 h-4" /> Bị khóa
                      </div>
                    )}
                  </td>
                  <td className="p-4 md:px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-4 py-2 bg-brand-surface text-brand-text font-bold text-xs rounded-xl hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                      <button
                        onClick={() => handleToggleLock(user)}
                        disabled={isMutating}
                        className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                          user.status === 'ACTIVE'
                            ? 'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white'
                            : 'bg-brand-success/10 text-brand-success hover:bg-brand-success hover:text-white'
                        }`}
                      >
                        {user.status === 'ACTIVE' ? (
                          <><Lock className="w-3.5 h-3.5" /> Khóa</>
                        ) : (
                          <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-brand-text/50 font-bold">
                    Không tìm thấy tài khoản nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 md:px-8 border-t border-black/5 bg-white flex justify-between items-center text-sm font-bold text-brand-text/50">
          <span>Hiển thị {users.length} tài khoản</span>
          <span>Dữ liệu lấy từ backend</span>
        </div>
      </div>

      {selectedUser && (
        <Dialog onClose={() => setSelectedUser(null)} title="Chi tiết tài khoản">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <Detail label="Họ tên" value={selectedUser.fullName} />
            <Detail label="Email" value={selectedUser.email} />
            <Detail label="Vai trò" value={roleLabels[selectedUser.role] || selectedUser.role} />
            <Detail label="Trạng thái" value={selectedUser.status} />
            <Detail label="Mã nhân sự" value={selectedUser.staffCode || 'Không có'} />
            <Detail label="GPLX" value={selectedUser.licenseNumber || 'Không có'} />
            <Detail label="Lý do khóa" value={selectedUser.lockReason || 'Không có'} />
          </div>
        </Dialog>
      )}

      {isAddModalOpen && (
        <Dialog onClose={() => setIsAddModalOpen(false)} title="Cấp tài khoản nhân sự">
          <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
            <Field label="Họ và tên" value={newAccount.fullName} onChange={(value) => setNewAccount({ ...newAccount, fullName: value })} required />
            <Field label="Email công tác" type="email" value={newAccount.email} onChange={(value) => setNewAccount({ ...newAccount, email: value })} required />
            <div>
              <label className="block text-sm font-bold text-brand-text/70 mb-2">Vai trò</label>
              <select
                value={newAccount.role}
                onChange={(event) => setNewAccount({ ...newAccount, role: event.target.value })}
                className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
              >
                <option value="DRIVER">Tài xế</option>
                <option value="CONDUCTOR">Phụ xe</option>
                <option value="DISPATCHER">Điều phối viên</option>
                <option value="ADMIN">Quản trị</option>
              </select>
            </div>
            {newAccount.role !== 'ADMIN' && (
              <Field label="Mã nhân sự" value={newAccount.employeeCode} onChange={(value) => setNewAccount({ ...newAccount, employeeCode: value })} required={newAccount.role !== 'DRIVER'} />
            )}
            {newAccount.role === 'DRIVER' && (
              <Field label="Số GPLX" value={newAccount.licenseNumber} onChange={(value) => setNewAccount({ ...newAccount, licenseNumber: value })} required />
            )}
            <Field label="Số điện thoại" value={newAccount.phoneNumber} onChange={(value) => setNewAccount({ ...newAccount, phoneNumber: value })} />
            <Field label="Mật khẩu khởi tạo" type="text" value={newAccount.password} onChange={(value) => setNewAccount({ ...newAccount, password: value })} required />

            <button
              type="submit"
              disabled={isMutating}
              className="w-full py-4 mt-2 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-text/20 disabled:opacity-60"
            >
              {isMutating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Tạo tài khoản
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-2xl font-black mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-text/70 mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface p-4">
      <div className="text-xs font-black text-brand-text/40 uppercase">{label}</div>
      <div className="font-bold text-brand-text mt-1 break-words">{value}</div>
    </div>
  );
}
