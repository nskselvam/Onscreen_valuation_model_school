import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useCalculateSpokenEnglishOverallPercentilesMutation,
  useCalculateSpokenEnglishDistrictPercentilesMutation,
  useCalculateSpokenEnglishAllDistrictsPercentilesMutation,
  useRevokeSpokenEnglishOverallPercentilesMutation,
  useRevokeSpokenEnglishDistrictPercentilesMutation,
  useRevokeSpokenEnglishAllDistrictsPercentilesMutation,
} from '../redux-slice/spokenEnglishPercentileApiSlice';

export const useSpokenEnglishPercentileCalculation = () => {
  const [calculateOverall] = useCalculateSpokenEnglishOverallPercentilesMutation();
  const [calculateDistrict] = useCalculateSpokenEnglishDistrictPercentilesMutation();
  const [calculateAllDistricts] = useCalculateSpokenEnglishAllDistrictsPercentilesMutation();
  const [revokeOverall] = useRevokeSpokenEnglishOverallPercentilesMutation();
  const [revokeDistrict] = useRevokeSpokenEnglishDistrictPercentilesMutation();
  const [revokeAllDistricts] = useRevokeSpokenEnglishAllDistrictsPercentilesMutation();

  const [loading, setLoading] = useState({});

  const handleCalculateOverall = async (testCode) => {
    const key = `overall-${testCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await calculateOverall({ testCode }).unwrap();
      toast.success(result.message || 'Overall percentiles calculated successfully!');
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to calculate overall percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCalculateDistrict = async (testCode, districtCode) => {
    const key = `district-${testCode}-${districtCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await calculateDistrict({ testCode, districtCode }).unwrap();
      toast.success(result.message || `District percentiles calculated for ${districtCode}!`);
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to calculate district percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCalculateAllDistricts = async (testCode) => {
    const key = `all-districts-${testCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await calculateAllDistricts({ testCode }).unwrap();
      toast.success(result.message || 'All district percentiles calculated successfully!');
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to calculate all district percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRevokeOverall = async (testCode) => {
    const key = `revoke-overall-${testCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await revokeOverall({ testCode }).unwrap();
      toast.success(result.message || 'Overall percentiles revoked successfully!');
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to revoke overall percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRevokeDistrict = async (testCode, districtCode) => {
    const key = `revoke-district-${testCode}-${districtCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await revokeDistrict({ testCode, districtCode }).unwrap();
      toast.success(result.message || `District percentiles revoked for ${districtCode}!`);
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to revoke district percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRevokeAllDistricts = async (testCode) => {
    const key = `revoke-all-districts-${testCode}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const result = await revokeAllDistricts({ testCode }).unwrap();
      toast.success(result.message || 'All district percentiles revoked successfully!');
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || 'Failed to revoke all district percentiles';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const isLoading = (type, testCode, districtCode = null) => {
    switch (type) {
      case 'overall':
        return loading[`overall-${testCode}`] || false;
      case 'district':
        return loading[`district-${testCode}-${districtCode}`] || false;
      case 'all-districts':
        return loading[`all-districts-${testCode}`] || false;
      case 'revoke-overall':
        return loading[`revoke-overall-${testCode}`] || false;
      case 'revoke-district':
        return loading[`revoke-district-${testCode}-${districtCode}`] || false;
      case 'revoke-all-districts':
        return loading[`revoke-all-districts-${testCode}`] || false;
      default:
        return false;
    }
  };

  return {
    handleCalculateOverall,
    handleCalculateDistrict,
    handleCalculateAllDistricts,
    handleRevokeOverall,
    handleRevokeDistrict,
    handleRevokeAllDistricts,
    isLoading,
  };
};
