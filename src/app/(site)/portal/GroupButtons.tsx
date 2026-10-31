import { cancelJoin, cancelLeave, leaveGroup, requestJoin } from './actions';

// Join, leave and rejoin controls. Every request is approved by the group's manager, coach or leader.
export default function GroupButtons({ slug, status, leave, role, to = '/portal/join' }: { slug: string; status: string | null; leave: boolean; role: string | null; to?: string }) {
  if (status === 'pending')
    return <span className="row"><span className="badge warn"><i className="fa-solid fa-hourglass-half" /> Join request pending</span>
      <form action={cancelJoin.bind(null, slug, to)}><button className="btn sm out">Cancel</button></form></span>;
  if (status === 'active') {
    const coachingRole = role && role !== 'member';
    return <span className="row"><span className="badge">{coachingRole ? role : 'Member'}</span>
      {leave
        ? <><span className="badge warn"><i className="fa-solid fa-hourglass-half" /> Leave request pending</span><form action={cancelLeave.bind(null, slug, to)}><button className="btn sm out">Cancel</button></form></>
        : <form action={leaveGroup.bind(null, slug, to)}><button className="btn sm out">Leave</button></form>}</span>;
  }
  return <form action={requestJoin.bind(null, slug, to)}>
    <button className="btn sm"><i className="fa-solid fa-user-plus" /> {status === 'left' || status === 'rejected' ? 'Rejoin' : 'Apply to join'}</button></form>;
}
