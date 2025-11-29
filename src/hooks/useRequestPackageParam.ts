import { useState, useEffect } from 'react';

interface RequestParams {
  packageId: string;
  restaurantId: string;
  source: string;
}

export const useRequestPackageParam = (): RequestParams => {
  const [params, setParams] = useState<RequestParams>({
    packageId: "",
    restaurantId: "",
    source: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('packageId');
    const restaurantId = urlParams.get('restaurantId');
    const source = urlParams.get('source');

    setParams({
      packageId: packageId || "",
      restaurantId: restaurantId || "",
      source: source || ""
    });
  }, []);

  return params;
};