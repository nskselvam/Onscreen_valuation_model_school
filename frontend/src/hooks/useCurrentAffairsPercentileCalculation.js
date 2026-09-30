import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useCalculateCurrentAffairsOverallPercentilesMutation,
  useCalculateCurrentAffairsDistrictPercentilesMutation,
  useCalculateCurrentAffairsAllDistrictsPercentilesMutation,
  useRevokeCurrentAffairsOverallPercentilesMutation,
  useRevokeCurrentAffairsDistrictPercentilesMutation,
  useRevokeCurrentAffairsAllDistrictsPercentilesMutation,
} from '../redux-slice/currentAffairsPercentileApiSlice';

export const useCurrentAffairsPercentileCalculation = () => {
  const [calculateOverall] = useCalculateCurrentAffairsOverallPercentilesMutation();
  const [calculateDistrict] = useCalculateCurrentAffairsDistrictPercentilesMutation();
  const [calculateAllDistricts] = useCalculateCurrentAffairsAllDistrictsPercentilesMutation();
  const [revokeOverall] = useRevokeCurrentAffairsOverallPercentilesMutation();
  const [revokeDistrict] = useRevokeCurrentAffairsDistrictPercentilesMutation();
  const [revokeAllDistricts] = useRevokeCurrentAffairsAllDistrictsPercentilesMutation();

  const [loading, setLoading] = useState({});

  const withLoader = async (key, action, successFallback, errorFallback) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await action();
      toast.success(result.message || successFallback);
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error?.data?.message || errorFallback;
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleCalculateOverall = (testCode) =>
    withLoader(
      `overall-${testCode}`,
      () => calculateOverall({ testCode }).unwrap(),
      'Overall percentiles calculated successfully!',
      'Failed to calculate overall percentiles'
    );

  const handleCalculateDistrict = (testCode, districtCode) =>
    withLoader(
      `district-${testCode}-${districtCode}`,
      () => calculateDistrict({ testCode, districtCode }).unwrap(),
      `District percentiles calculated for ${districtCode}!`,
      'Failed to calculate district percentiles'
    );

  const handleCalculateAllDistricts = (testCode) =>
    withLoader(
      `all-districts-${testCode}`,
      () => calculateAllDistricts({ testCode }).unwrap(),
      'All district percentiles calculated successfully!',
      'Failed to calculate all district percentiles'
    );

  const handleRevokeOverall = (testCode) =>
    withLoader(
      `revoke-overall-${testCode}`,
      () => revokeOverall({ testCode }).unwrap(),
      'Overall percentiles revoked successfully!',
      'Failed to revoke overall percentiles'
    );

  const handleRevokeDistrict = (testCode, districtCode) =>
    withLoader(
      `revoke-district-${testCode}-${districtCode}`,
      () => revokeDistrict({ testCode, districtCode }).unwrap(),
      `District percentiles revoked for ${districtCode}!`,
      'Failed to revoke district percentiles'
    );

  const handleRevokeAllDistricts = (testCode) =>
    withLoader(
      `revoke-all-districts-${testCode}`,
      () => revokeAllDistricts({ testCode }).unwrap(),
      'All district percentiles revoked successfully!',
      'Failed to revoke all district percentiles'
    );

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
