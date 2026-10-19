import { useState } from 'react';
import { useSpace } from '@/features/spaces/SpaceContext';
import { MemberList } from '@/features/members/MemberList';
import { PendingInvitesPanel } from '@/features/invites/PendingInvitesPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { spaceService } from '@/features/spaces/spaceService';
import { Shield, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminPage() {
  const { currentSpace, isOwner, isAdmin, refreshSpaces } = useSpace();
  const navigate = useNavigate();

  const [name, setName] = useState(currentSpace?.name || '');
  const [description, setDescription] = useState(currentSpace?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!currentSpace || !isAdmin) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        You must be an admin to view this page.
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      await spaceService.updateSpace(currentSpace.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      await refreshSpaces();
      setMessage('Space settings updated successfully.');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!isOwner) return;
    const confirmName = prompt(
      `To permanently delete this Space and all member data, type the Space name "${currentSpace.name}":`
    );
    if (confirmName !== currentSpace.name) return;

    try {
      await spaceService.deleteSpace(currentSpace.id);
      await refreshSpaces();
      navigate('/');
    } catch {
      alert('Failed to delete Space');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <span>Space Administration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage membership roles, pending approvals, invite links, and Space settings.
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-brand-400">
          {message}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">Space Settings</h2>

        <Input
          label="Space Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
            <Save className="w-3.5 h-3.5 mr-1" /> Save Settings
          </Button>
        </div>
      </form>

      {/* Member Management */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <MemberList spaceId={currentSpace.id} />
      </div>

      {/* Invites & Passes */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <PendingInvitesPanel spaceId={currentSpace.id} />
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 space-y-3">
          <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
          <p className="text-xs text-rose-200/80">
            Deleting this Space removes all memberships, invite links, and associated records permanently. This action cannot be undone.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDeleteSpace}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Space Permanently
          </Button>
        </div>
      )}
    </div>
  );
}
