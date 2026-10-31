import Detail, { detailMeta } from '../../detail';

type Props = { params: Promise<{ id: string }> };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) { return detailMeta((await params).id, 'stories'); }
export default async function Page({ params }: Props) { return <Detail id={(await params).id} kind="stories" />; }
