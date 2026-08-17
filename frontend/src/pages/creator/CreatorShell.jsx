import './creatorWorkspace.css';
import { useAuth } from '../../contexts/AuthContext';
import CreatorOnboardingModal from '../../components/modals/CreatorOnboardingModal';
import SEO from '../../components/common/SEO';

/** Wraps creator pages with Opportunities-style Plus Jakarta Sans typography. */
export default function CreatorShell({ children, className = '', style, ...rest }) {
  const { user } = useAuth();
  const showModal = user && user.role === 'creator' && !user.onboardingCompleted;

  return (
    <div
      className={['page-enter', 'creator-workspace', className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    >
      <SEO 
        title="Creator Community Hub | Creatokite"
        description="Access campaigns, earnings, portfolio, and collaboration briefs in the Creatokite Creator Community Workspace."
        canonical="/creator"
      />
      {showModal && <CreatorOnboardingModal user={user} />}
      {children}
    </div>
  );
}

