import { pageInClass } from '../../utils/pageTransition';

export default function Transition({ children }) {
  return <div className={`min-h-screen ${pageInClass()}`}>{children}</div>;
}
