import ImageField from '@/components/ImageField';
import type { Field } from '@/lib/resources';

function localDT(v: unknown) {
  const d = v ? new Date(v as string) : new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function FieldInput({ f, v }: { f: Field; v: any }) {
  const id = 'f_' + f.name;
  let input: React.ReactNode;
  switch (f.type) {
    case 'textarea': input = <textarea id={id} name={f.name} rows={3} defaultValue={v ?? ''} required={f.required} />; break;
    case 'markdown': input = <textarea id={id} name={f.name} rows={14} defaultValue={v ?? ''} style={{ fontFamily: 'monospace' }} />; break;
    case 'heading': return <h2 className="fhead">{f.label}</h2>;
    case 'select':
    case 'ref': input = <select id={id} name={f.name} defaultValue={String(v ?? '')}>{f.options?.map((o) => { const [val, label] = o.includes('|') ? o.split('|') : [o, o]; return <option key={val} value={val}>{label}</option>; })}</select>; break;
    case 'checkbox': input = <input id={id} type="checkbox" name={f.name} defaultChecked={v ?? ['published', 'enabled', 'listed'].includes(f.name)} style={{ width: 'auto' }} />; break;
    case 'date': input = <input id={id} type="date" name={f.name} defaultValue={v ? new Date(v as string).toISOString().slice(0, 10) : ''} />; break;
    case 'datetime': input = <input id={id} type="datetime-local" name={f.name} defaultValue={localDT(v)} />; break;
    case 'number': input = <input id={id} type="number" name={f.name} defaultValue={v ?? 0} />; break;
    case 'image': input = <ImageField name={f.name} initial={v ?? ''} required={f.required} />; break;
    default: input = <input id={id} type="text" name={f.name} defaultValue={v ?? ''} required={f.required} />;
  }
  const help = f.type === 'markdown' ? 'Markdown: ## Heading, **bold**, - list, [link](https://…), ![image](/uploads/…)' : f.help;
  return <div className="fld"><label htmlFor={id}>{f.label}</label>{input}{help && <div className="help">{help}</div>}</div>;
}
