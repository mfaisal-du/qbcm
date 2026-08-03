import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, BookOpen, Tag } from 'lucide-react';
import { academicService } from '../services/api';
import { useAuthStore } from '../store';
import { Button, Input, TextArea, Select, Modal, Badge, Spinner } from '../components/Common';
import toast from 'react-hot-toast';

const normalizeRole = (role) => role === 'admin' ? 'administrator' : role;

export const AdminAcademicPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);
  const isSuperAdmin = role === 'super_admin';

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subjects');

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [subjectForm, setSubjectForm] = useState({ name: '', courseCode: '', yearNumber: 1, semester: 1, phase: 'Basic' });
  const [topicForm, setTopicForm] = useState({ name: '', description: '', subjectId: '' });

  const subjectPhases = ['Basic', 'Integrated', 'Clinical'];

  const loadSubjects = async () => {
    try {
      const res = await academicService.getSubjects({});
      const data = res.data.subjects || [];
      const unique = data.filter((s, idx, arr) => arr.findIndex(x => x.name === s.name) === idx);
      setSubjects(unique);
    } catch {
      toast.error('Failed to load subjects');
    }
  };

  const loadTopics = async () => {
    try {
      const res = await academicService.getTopics({});
      const data = res.data.topics || [];
      const unique = data.filter((t, idx, arr) => arr.findIndex(x => x.name === t.name) === idx);
      setTopics(unique);
    } catch {
      toast.error('Failed to load topics');
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadSubjects(), loadTopics()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectForm.name.trim()) { toast.error('Subject name is required'); return; }
    setSaving(true);
    try {
      await academicService.createSubject({ ...subjectForm, name: subjectForm.name.trim() });
      toast.success('Subject created');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', courseCode: '', yearNumber: 1, semester: 1, phase: 'Basic' });
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.name.trim() || !topicForm.subjectId) { toast.error('Topic name and subject are required'); return; }
    setSaving(true);
    try {
      await academicService.createTopic({ ...topicForm, name: topicForm.name.trim() });
      toast.success('Topic created');
      setShowTopicModal(false);
      setTopicForm({ name: '', description: '', subjectId: '' });
      loadTopics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create topic');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Structure</h1>
            <p className="text-gray-500 text-sm mt-1">Manage subjects and topics</p>
          </div>
          <Button onClick={() => navigate('/admin/dashboard')} variant="secondary">Back to Dashboard</Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex gap-1 p-1">
            {[
              { key: 'subjects', label: 'Subjects', icon: BookOpen },
              { key: 'topics', label: 'Topics', icon: Tag }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'subjects' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Subjects ({subjects.length})</h3>
              <Button onClick={() => setShowSubjectModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </div>
            {subjects.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No subjects found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Year</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Semester</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Phase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subjects.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.courseCode || '—'}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.yearNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{s.semester || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge type={s.phase === 'Basic' ? 'info' : s.phase === 'Integrated' ? 'warning' : 'success'}>
                            {s.phase || '—'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Topics ({topics.length})</h3>
              <Button onClick={() => setShowTopicModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Topic
              </Button>
            </div>
            {topics.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No topics found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Subject</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topics.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800 font-medium">{t.name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                            {t.subjectName || t.subject || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-md">{t.description ? t.description.substring(0, 120) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Subject Modal */}
        <Modal isOpen={showSubjectModal} onClose={() => setShowSubjectModal(false)} title="Add Subject" size="md">
          <form onSubmit={handleAddSubject} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Subject Name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required placeholder="e.g. Physiology" />
              <Input label="Course Code" value={subjectForm.courseCode} onChange={(e) => setSubjectForm({ ...subjectForm, courseCode: e.target.value })} placeholder="e.g. PHYS-101" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select label="Year" value={subjectForm.yearNumber} onChange={(e) => setSubjectForm({ ...subjectForm, yearNumber: Number(e.target.value) })}
                options={[1,2,3,4,5,6].map(y => ({ label: `Year ${y}`, value: y }))} />
              <Select label="Semester" value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                options={[1,2].map(s => ({ label: `Semester ${s}`, value: s }))} />
              <Select label="Phase" value={subjectForm.phase} onChange={(e) => setSubjectForm({ ...subjectForm, phase: e.target.value })}
                options={subjectPhases.map(p => ({ label: p, value: p }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Subject</Button>
            </div>
          </form>
        </Modal>

        {/* Add Topic Modal */}
        <Modal isOpen={showTopicModal} onClose={() => setShowTopicModal(false)} title="Add Topic" size="md">
          <form onSubmit={handleAddTopic} className="space-y-4">
            <Input label="Topic Name" value={topicForm.name} onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })} required placeholder="e.g. Cardiovascular System" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject <span className="text-danger">*</span></label>
              <select
                value={topicForm.subjectId}
                onChange={(e) => setTopicForm({ ...topicForm, subjectId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.courseCode ? `(${s.courseCode})` : ''}</option>
                ))}
              </select>
            </div>
            <TextArea label="Description (optional)" value={topicForm.description} onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })} rows={3} placeholder="Brief description of this topic..." />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowTopicModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Topic</Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};
