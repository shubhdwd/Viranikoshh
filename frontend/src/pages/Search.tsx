
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Search and Explore are one destination. This route only preserves older links
 * (including tag links carrying ?q=) by handing them to Explore.
 */
export function Search() {
  const { search } = useLocation();
  return <Navigate to={`/explore${search}`} replace />;
}
