import Catalog from './catalog';
import { getPhantoms } from '../lib/phantoms';

export default function Home() {
  return <Catalog phantoms={getPhantoms()} />;
}
