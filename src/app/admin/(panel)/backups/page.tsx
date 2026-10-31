import { requireAdmin } from '@/lib/auth';
import { listBackups } from '@/lib/backup-core.mjs';
import { storageInfo } from '@/lib/storage';
import { makeBackup, removeBackup } from '../../actions';

const size = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

export default async function Backups({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin('backups');
  const sp = await searchParams;
  const files = await listBackups();
  const st = storageInfo();
  return (
    <>
      <h1>Backups & Storage</h1>
      {sp.saved && <div className="alert">Done.</div>}
      {sp.error && <div className="alert err">{sp.error}</div>}
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Storage</h2>
        <p>Uploaded files are stored in: <b>{st.mode === 'S3' ? `Amazon S3 compatible bucket (${st.detail})` : `local disk (${st.detail})`}</b>.
          {st.mode !== 'S3' && ' Set the S3_* variables in the environment to switch to S3.'}</p>
      </div>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Database backup</h2>
        <form action={makeBackup} className="row">
          <button className="btn"><i className="fa-solid fa-database" /> Back up now</button>
          {st.mode !== 'S3' && <label style={{ fontWeight: 400 }}><input type="checkbox" name="uploads" style={{ width: 'auto' }} /> Also back up uploaded files</label>}
        </form>
        <div className="help">Backups are saved on the server{process.env.S3_BUCKET && process.env.BACKUP_TO_S3 !== 'false' ? ' and copied to S3' : ''}. Set BACKUP_EVERY_HOURS for automatic backups. To restore, run <code>npm run db:restore -- backups/&lt;file&gt; --yes</code> on the server.</div>
      </div>
      <div className="panel">
        <table className="tbl"><thead><tr><th>File</th><th>Type</th><th>Size</th><th>Created</th><th /></tr></thead><tbody>
          {files.length === 0 && <tr><td colSpan={5}>No backups yet.</td></tr>}
          {files.map((f) => (
            <tr key={f.name}><td>{f.name}</td><td>{f.kind}</td><td>{size(f.size)}</td><td>{new Date(f.created).toLocaleString()}</td>
              <td className="row"><a className="btn sm out" href={`/api/admin/backup/${encodeURIComponent(f.name)}`}><i className="fa-solid fa-download" /> Download</a>
                <form action={removeBackup.bind(null, f.name)}><button className="btn sm danger"><i className="fa-solid fa-trash" /></button></form></td></tr>))}
        </tbody></table>
      </div>
    </>
  );
}
