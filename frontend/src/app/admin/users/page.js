"use client";

import { useState, useEffect } from 'react';
import { Users, Search, Filter, Lock, Unlock, ShieldAlert, CheckCircle2, User as UserIcon, MoreVertical, Plus, Save, X, Loader2 } from 'lucide-react';
import { adminUsersService } from '@/services/adminUsers.service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', email: '', role: 'Tài xế' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminUsersService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleLock = async (id) => {
    const userToToggle = users.find(u => u.id === id);
    if (!userToToggle) return;
    
    const newStatus = userToToggle.status === 'active' ? 'locked' : 'active';
    try {
      await adminUsersService.toggleLock(id, newStatus);
      setUsers(users.map(user => {
        if (user.id === id) {
          alert(`Đã ${newStatus === 'locked' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản của ${user.name}`);
          return { ...user, status: newStatus };
        }
        return user;
      }));
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="h-full flex flex-col gap-6 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-text mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-primary" /> Quản lý Tài khoản
          </h1>
          <p className="text-brand-text/60 font-medium">Tìm kiếm, tra cứu thông tin và quản lý trạng thái tài khoản người dùng.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-text text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Cấp Tài Khoản
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col overflow-hidden">
        
        {/* Toolbar: Search & Filter */}
        <div className="p-6 md:p-8 border-b border-black/5 bg-brand-surface/30 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          
          <div className="relative w-full md:w-1/2 xl:w-1/3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
            <input 
              type="text" 
              placeholder="Tìm theo Tên, Mã số, Email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-brand-primary shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-primary cursor-pointer shadow-sm appearance-none"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Sinh viên">Chỉ Sinh viên</option>
              <option value="Tài xế">Chỉ Tài xế</option>
              <option value="Điều phối">Chỉ Điều phối</option>
            </select>
            <button className="bg-white border border-black/5 p-3 rounded-2xl text-brand-text hover:bg-brand-surface transition-colors shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
        </div>

        {/* Data Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-brand-text/50">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="font-bold">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`border-b border-black/5 transition-colors hover:bg-brand-surface/30 ${user.status === 'locked' ? 'bg-brand-danger/5' : ''}`}>
                    
                    {/* User Info */}
                    <td className="p-4 md:px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.role === 'Sinh viên' ? 'bg-brand-primary/20 text-brand-primary' : user.role === 'Tài xế' ? 'bg-brand-text/10 text-brand-text' : 'bg-brand-secondary/20 text-brand-secondary'}`}>
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-brand-text">{user.name}</div>
                          <div className="text-xs font-bold text-brand-text/50">{user.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4 md:px-8 py-4">
                      <div className="text-sm font-medium">{user.email}</div>
                    </td>

                    {/* Role */}
                    <td className="p-4 md:px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${user.role === 'Sinh viên' ? 'bg-brand-primary/10 text-brand-primary' : user.role === 'Tài xế' ? 'bg-brand-text/10 text-brand-text' : 'bg-brand-secondary/10 text-brand-secondary'}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4 md:px-8 py-4">
                      {user.status === 'active' ? (
                        <div className="flex items-center gap-1.5 text-brand-success text-sm font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Hoạt động
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-brand-danger text-sm font-bold">
                          <ShieldAlert className="w-4 h-4" /> Bị Khóa
                        </div>
                      )}
                    </td>

                    {/* Actions (Lock/Unlock) */}
                    <td className="p-4 md:px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="px-4 py-2 bg-brand-surface text-brand-text font-bold text-xs rounded-xl hover:bg-black hover:text-white transition-colors">
                          Xem
                        </button>
                        <button 
                          onClick={() => handleToggleLock(user.id)}
                          className={`px-4 py-2 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
                            user.status === 'active' 
                              ? 'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white' 
                              : 'bg-brand-success/10 text-brand-success hover:bg-brand-success hover:text-white'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <><Lock className="w-3.5 h-3.5" /> Khóa</>
                          ) : (
                            <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>
                          )}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-brand-text/50 font-bold">
                    Không tìm thấy tài khoản nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 md:px-8 border-t border-black/5 bg-white flex justify-between items-center text-sm font-bold text-brand-text/50">
          <span>Hiển thị 1 - {filteredUsers.length} trên tổng {users.length}</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-brand-surface rounded-lg hover:bg-black hover:text-white transition-colors">Trang trước</button>
            <button className="px-3 py-1 bg-brand-surface rounded-lg hover:bg-black hover:text-white transition-colors">Trang sau</button>
          </div>
        </div>

      </div>

      {/* Modal Add Account */}
      {isAddModalOpen && (
        <div className="absolute inset-0 z-50 bg-brand-text/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 bg-brand-surface rounded-full flex items-center justify-center hover:bg-brand-danger/10 hover:text-brand-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-2xl font-black mb-6">Cấp Tài khoản Nhân sự</h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAdding(true);
              const newUser = {
                id: `NV${Math.floor(Math.random() * 1000)}`,
                name: newAccount.name,
                email: newAccount.email,
                role: newAccount.role,
                status: 'active',
                joined: new Date().toLocaleDateString('vi-VN')
              };
              
              try {
                const addedUser = await adminUsersService.addUser(newUser);
                setUsers([addedUser.data, ...users]);
                setIsAddModalOpen(false);
                setNewAccount({ name: '', email: '', role: 'Tài xế' });
                alert('Đã cấp tài khoản thành công!');
              } catch (err) {
                console.error(err);
                alert('Lỗi tạo tài khoản.');
              } finally {
                setIsAdding(false);
              }
            }} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2">Họ và tên</label>
                <input 
                  type="text" 
                  required
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2">Email công tác</label>
                <input 
                  type="email" 
                  required
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                  className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2">Vai trò (Chức vụ)</label>
                <select 
                  value={newAccount.role}
                  onChange={(e) => setNewAccount({...newAccount, role: e.target.value})}
                  className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all appearance-none"
                >
                  <option value="Tài xế">Tài xế</option>
                  <option value="Phụ xe">Phụ xe (Soát vé)</option>
                  <option value="Điều phối">Điều phối viên</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-2">Mật khẩu khởi tạo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập mật khẩu cho tài khoản..."
                  className="w-full bg-brand-surface border border-transparent rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-brand-primary focus:bg-white transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isAdding}
                className="w-full py-4 mt-2 bg-brand-text text-white font-bold rounded-2xl hover:bg-black transition-colors flex justify-center items-center gap-2 shadow-xl shadow-brand-text/20 disabled:opacity-70"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                {isAdding ? 'Đang tạo...' : 'Tạo Tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
