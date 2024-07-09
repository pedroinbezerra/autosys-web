"use cliente"

import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation'
import axios from 'axios';
import { UserContext } from '../../context/UserContext';
import { ServiceContext } from '../../context/ServiceContext.jsx';
import { VehicleContext } from '../../context/VehicleContext';
import { ClientContext } from '../../context/ClientContext';
import { ToastVariant, ToastColor } from '../ToastColors';
import { ApiContext } from '../../context/ApiContext';

export function useClearStorage() {
  const { deleteService } = useContext(ServiceContext);
  const { deleteVehicle } = useContext(VehicleContext);
  const { deleteClient } = useContext(ClientContext);

  const clearStorage = async () => {
    deleteService();
    deleteVehicle();
    deleteClient();
  }

  return { clearStorage };
}

export function guard() {
  const { getPersistAuth } = useContext(UserContext);
  const [getUser, setGetUser] = useState(getPersistAuth());
  const { getJwt, apiKey } = useContext(ApiContext);

  const router = useRouter();

  async function asyncRunner() {
    const actualData = new Date();
    const passwordExpirationData = new Date(getUser.passwordExpiration);

    if (typeof window != "undefined") {
      if (actualData.getTime() > passwordExpirationData.getTime()) {
        router.push("/home");
        return;
      }

      if (getJwt() == null) {
        return;
      }

      const user: any = getUser._id;

      const config = {
        headers: {
          "Authorization": "Bearer " + getJwt(),
          "Content-Type": "application/json",
          "apiKey": apiKey,
        }
      }

      await axios.post(process.env.USER_PERMISSIONS!, { _id: user, route: window.location.pathname }, config).then((res) => {
        const result = res.data;

        if (!result) {
          window.localStorage.setItem("alert", JSON.stringify({ type: { variant: ToastVariant.ERROR, color: ToastColor.LIGHT }, message: "Você não possui acesso a este recurso." }));
          router.push("/home");
        }

      }).catch((err) => {
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao verificar permissão do usuário.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }
  }
  useEffect(() => {
    if (typeof window != "undefined") {
      if (!getUser) {
        router.push("/login");
        return;
      }
    }

    asyncRunner();
  }, []);
}

export function useRedirect() {
  const { getPersistAuth } = useContext(UserContext);
  const { clearStorage } = useClearStorage();
  const { getJwt, apiKey } = useContext(ApiContext);

  const redirect = async (url: string, router: any) => {
    if (typeof window != "undefined") {
      if (getJwt() == null) {
        return;
      }
      const config = {
        headers: {
          "Authorization": "Bearer " + getJwt(),
          "Content-Type": "application/json",
          "apiKey": apiKey,
        }
      }

      const user: any = getPersistAuth()._id;
      const permission = await axios.post(process.env.USER_PERMISSIONS!, { _id: user, route: url }, config).then((res) => res.data).catch((err) => {
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao verificar permissão do usuário.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
      if (!permission) {
        return false;
      }
      clearStorage();
      router.push(url);
    }
  }

  return { redirect };
}

export function useCheckURL() {
  const { getPersistAuth } = useContext(UserContext);
  const { getJwt, apiKey } = useContext(ApiContext);

  const checkURL = async (url: string) => {
    if (getJwt() == null) {
      return;
    }
    const config = {
      headers: {
        "Authorization": "Bearer " + getJwt(),
        "Content-Type": "application/json",
        "apiKey": apiKey,
      }
    }

    const user: any = getPersistAuth()._id;
    const permission = await axios.post(process.env.USER_PERMISSIONS!, { _id: user, route: url }, config).then((res) => res.data).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao verificar permissão do usuário.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

    if (permission) {
      return true;
    }

    return false;
  }

  return { checkURL };
}