import { redirect } from 'next/navigation';

// /rewards duplicava /loja com outro checkout. Fica só o redirecionamento para
// links antigos e favoritos.
export default function RewardsRedirect() {
  redirect('/loja');
}
