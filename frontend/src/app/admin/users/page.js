"use client";

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, Lock, Plus, Search, ShieldAlert, Unlock, UserRound, Users, X } from 'lucide-react';
import { adminUsersService } from '@/services/adminUsers.service';

const roleLabels = {
  STUDENT: 'Sinh viên',
  DRIVER: 'Tài xế',
  CONDUCTOR: 'Phụ xe',
  DISPATCHER: 'Điều phối',
  ADMIN: 'Quản trị viên'
};

const statusLabels = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khóa'
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [newAccount, setNewAccount] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'DRIVER',
    password: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminUsersService.getUsers();
      setUsers(data);
      setSelectedUser((current) => current ? data.find((item) => item.id === current.id) ?? null : null);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    adminUsersService.getUsers()
      .then((data) => {
        if (!active) return;
        setUsers(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Không tải được danh sách tài khoản.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const text = `${user.code ?? ''} ${user.name ?? ''} ${user.email ?? ''} ${user.phoneNumber ?? ''}`.toLowerCase();
      return (!keyword || text.includes(keyword))
        && (roleFilter === 'all' || user.role === roleFilter)
        && (statusFilter === 'all' || user.status === statusFilter);
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleToggleLock = async (user) => {
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const updated = await adminUsersService.toggleLock(user.id, user.status, lockReason);
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelectedUser(updated);
      setLockReason('');
      setNotice(updated.status === 'LOCKED' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch (err) {
      setError(err.message || 'Không cập nhật được trạng thái tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    setError('');
    try {
      const created = await adminUsersService.addUser(newAccount);
      setUsers((items) => [created, ...items]);
      setSelectedUser(created);
      setIsAddModalOpen(false);
      setNewAccount({ fullName: '', email: '', phoneNumber: '', role: 'DRIVER', password: '' });
      setNotice('Đã tạo tài khoản nhân sự mới.');
    } catch (err) {
      setError(err.message || 'Không tạo được tài khoản.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-primary" /> Quản lý tài khoản
          </h1>
          <p className="text-brand-text/60 font-medium">Tìm kiếm, xem chi tiết, khóa hoặc mở khóa tài khoản người dùng.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-text text-white px-5 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Cấp tài khoản
        </button>
      </div>

      {notice && <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 p-4 text-sm font-bold text-brand-text">{notice}</div>}
      {error && <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm font-bold text-brand-danger">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 min-h-0 flex-1">
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-black/5 bg-brand-surface/30 flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm theo tên, email, SĐT hoặc mã..." className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary" />
            </div>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none">
              <option value="all">Tất cả vai trò</option>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none">
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-xs font-black text-brand-text/50 uppercase">Người dùng</th>
                  <th className="p-4 text-xs font-black text-brand-text/50 uppercase">Liên hệ</th>
                  <th className="p-4 text-xs font-black text-brand-text/50 uppercase">Vai trò</th>
                  <th className="p-4 text-xs font-black text-brand-text/50 uppercase">Trạng thái</th>
                  <th className="p-4 text-xs font-black text-brand-text/50 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="5" className="p-8 text-center font-bold text-brand-text/50">Đang tải tài khoản...</td></tr>}
                {!loading && filteredUsers.map((user) => (
                  <tr key={user.id} className={`border-b border-black/5 hover:bg-brand-surface/40 ${selectedUser?.id === user.id ? 'bg-brand-primary/5' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/15 text-brand-primary flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
                        <div>
                          <div className="font-bold text-brand-text">{user.name}</div>
                          <div className="text-xs font-bold text-brand-text/50">{user.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-brand-text/80">{user.email}<div className="text-xs text-brand-text/50">{user.phoneNumber || 'Chưa có SĐT'}</div></td>
                    <td className="p-4"><span className="px-3 py-1 rounded-lg text-xs font-black bg-brand-surface text-brand-text">{roleLabels[user.role] || user.role}</span></td>
                    <td className="p-4">
                      {user.status === 'ACTIVE'
                        ? <span className="inline-flex items-center gap-1.5 text-brand-success text-sm font-bold"><CheckCircle2 className="w-4 h-4" /> Hoạt động</span>
                        : <span className="inline-flex items-center gap-1.5 text-brand-danger text-sm font-bold"><ShieldAlert className="w-4 h-4" /> Bị khóa</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedUser(user)} className="px-3 py-2 bg-brand-surface rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-brand-text hover:text-white"><Eye className="w-4 h-4" /> Xem</button>
                        <button onClick={() => handleToggleLock(user)} disabled={saving} className="px-3 py-2 bg-brand-danger/10 text-brand-danger rounded-xl font-bold text-xs flex items-center gap-1 hover:bg-brand-danger hover:text-white disabled:opacity-60">
                          {user.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          {user.status === 'ACTIVE' ? 'Khóa' : 'Mở'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredUsers.length === 0 && <tr><td colSpan="5" className="p-8 text-center font-bold text-brand-text/50">Không có tài khoản phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 flex flex-col gap-5">
          <h2 className="text-xl font-black">Chi tiết tài khoản</h2>
          {selectedUser ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/15 text-brand-primary flex items-center justify-center"><UserRound className="w-8 h-8" /></div>
              <div>
                <div className="text-2xl font-black text-brand-text">{selectedUser.name}</div>
                <div className="text-sm font-bold text-brand-text/50">{selectedUser.code}</div>
              </div>
              <div className="grid gap-3 text-sm">
                <Info label="Email" value={selectedUser.email} />
                <Info label="Số điện thoại" value={selectedUser.phoneNumber || 'Chưa cập nhật'} />
                <Info label="Vai trò" value={roleLabels[selectedUser.role] || selectedUser.role} />
                <Info label="Trạng thái" value={statusLabels[selectedUser.status] || selectedUser.status} />
                <Info label="Lý do khóa" value={selectedUser.lockReason || 'Không có'} />
              </div>
              {selectedUser.status === 'ACTIVE' && (
                <textarea value={lockReason} onChange={(event) => setLockReason(event.target.value)} placeholder="Lý do khóa tài khoản..." className="min-h-24 rounded-2xl bg-brand-surface border border-transparent p-4 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              )}
              <button onClick={() => handleToggleLock(selectedUser)} disabled={saving} className="mt-auto py-3 rounded-2xl bg-brand-text text-white font-bold hover:bg-black disabled:opacity-60">
                {selectedUser.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
              </button>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-sm font-bold text-brand-text/40">Chọn một tài khoản để xem chi tiết.</div>
          )}
        </aside>
      </div>

      {isAddModalOpen && (
        <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 w-9 h-9 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger"><X className="w-4 h-4" /></button>
            <h2 className="text-2xl font-black mb-6">Cấp tài khoản nhân sự</h2>
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              <Input label="Họ và tên" value={newAccount.fullName} onChange={(value) => setNewAccount({ ...newAccount, fullName: value })} required />
              <Input label="Email" type="email" value={newAccount.email} onChange={(value) => setNewAccount({ ...newAccount, email: value })} required />
              <Input label="Số điện thoại" value={newAccount.phoneNumber} onChange={(value) => setNewAccount({ ...newAccount, phoneNumber: value })} />
              <label className="grid gap-2 text-sm font-bold text-brand-text/70">
                Vai trò
                <select value={newAccount.role} onChange={(event) => setNewAccount({ ...newAccount, role: event.target.value })} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="DRIVER">Tài xế</option>
                  <option value="CONDUCTOR">Phụ xe</option>
                  <option value="DISPATCHER">Điều phối viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </label>
              <Input label="Mật khẩu khởi tạo" type="password" value={newAccount.password} onChange={(value) => setNewAccount({ ...newAccount, password: value })} required />
              <button type="submit" disabled={saving} className="mt-2 py-4 rounded-2xl bg-brand-text text-white font-bold hover:bg-black disabled:opacity-60">Tạo tài khoản</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return <div className="rounded-2xl bg-brand-surface p-4"><div className="text-xs uppercase font-black text-brand-text/40 mb-1">{label}</div><div className="font-bold text-brand-text break-words">{value}</div></div>;
}

function Input({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-brand-text/70">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="bg-brand-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
    </label>
  );
}
