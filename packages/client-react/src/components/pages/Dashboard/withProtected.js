import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

export default (status, onlyUnAuth) => WarpedComponent => {
  return () => {
    const history = useHistory();
    const customer = useSelector(state => state.customerAuth.user);
    const isFirstRun = useRef(true);

    useEffect(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
      }
      if (!customer) history.replace('/dashboard/login');
      if (onlyUnAuth && customer) history.replace('/dashboard/overview');

      console.log(customer, status, WarpedComponent.name);
      if (status === 'VERIFIED' && customer?.status !== status) {
        history.replace('/dashboard/verify');
      }
      if (status === 'UNVERIFIED' && customer?.status === 'VERIFIED') {
        history.replace('/dashboard/overview');
      }
      if (WarpedComponent.name === 'DashboardContainer') {
        history.replace('/dashboard/overview');
      }
    }, [customer]);

    return <WarpedComponent />;
  };
};
