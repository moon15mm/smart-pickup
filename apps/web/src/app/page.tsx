import { redirect } from 'next/navigation';

// Root redirect — customers always arrive via /scan/:qr or direct store link
export default function RootPage() {
  redirect('/not-found');
}
