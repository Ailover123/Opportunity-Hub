import { useUser } from '../context/UserContext';
import { canAccess } from '../utils/featureConfig';

export const useFeatureAccess = () => {
    const { user } = useUser();
    
    const checkAccess = (featureId) => {
        return canAccess(user?.plan, featureId);
    };

    return { checkAccess, userPlan: user?.plan };
};
