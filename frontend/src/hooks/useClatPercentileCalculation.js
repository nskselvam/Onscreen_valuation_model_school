import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useCalculateClatOverallPercentilesMutation,
  useCalculateClatDistrictPercentilesMutation,
  useCalculateClatAllDistrictsPercentilesMutation,
  useRevokeClatOverallPercentilesMutation,
  useRevokeClatDistrictPercentilesMutation,
  useRevokeClatAllDistrictsPercentilesMutation,
} from '../redux-slice/clatPercentileApiSlice';

export const useClatPercentileCalculation = () => {
  const [calculateOverall] = useCalculateClatOverallPercentilesMutation();
  const [calculateDistrict] = useCalculateClatDistrictPercentilesMutation();
  const [calculateAllDistricts] = useCalculateClatAllDistrictsPercentilesMutation();
  const [revokeOverall] = useRevokeClatOverallPercentilesMutation();
  const [revokeDistrict] = useRevokeClatDistrictPercentilesMutation();
  const [revokeAllDistricts] = useRevokeClatAllDistrictsPercentilesMutation();
  const [loading, setLoading] = useState({});

  const run = async (key, action, successMessage, errorMessage) => {
    setLoading((previous) => ({ ...previous, [key]: true }));
    try {
      const result = await action();
      toast.success(result.message || successMessage);
      return { success: true, data: result };
    } catch (error) {
      const message = error?.data?.message || errorMessage;
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading((previous) => ({ ...previous, [key]: false }));
    }
  };

  return {
    handleCalculateOverall: (testCode) => run(`overall-${testCode}`, () => calculateOverall({ testCode }).unwrap(), 'Overall percentiles calculated successfully!', 'Failed to calculate overall percentiles'),
    handleCalculateDistrict: (testCode, districtCode) => run(`district-${testCode}-${districtCode}`, () => calculateDistrict({ testCode, districtCode }).unwrap(), `District percentiles calculated for ${districtCode}!`, 'Failed to calculate district percentiles'),
    handleCalculateAllDistricts: (testCode) => run(`all-districts-${testCode}`, () => calculateAllDistricts({ testCode }).unwrap(), 'All district percentiles calculated successfully!', 'Failed to calculate all district percentiles'),
    handleRevokeOverall: (testCode) => run(`revoke-overall-${testCode}`, () => revokeOverall({ testCode }).unwrap(), 'Overall percentiles revoked successfully!', 'Failed to revoke overall percentiles'),
    handleRevokeDistrict: (testCode, districtCode) => run(`revoke-district-${testCode}-${districtCode}`, () => revokeDistrict({ testCode, districtCode }).unwrap(), `District percentiles revoked for ${districtCode}!`, 'Failed to revoke district percentiles'),
    handleRevokeAllDistricts: (testCode) => run(`revoke-all-districts-${testCode}`, () => revokeAllDistricts({ testCode }).unwrap(), 'All district percentiles revoked successfully!', 'Failed to revoke all district percentiles'),
    isLoading: (type, testCode, districtCode = null) => loading[`${type}-${testCode}${districtCode ? `-${districtCode}` : ''}`] || false,
  };
};
