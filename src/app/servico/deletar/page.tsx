"use client";

import { useRouter } from 'next/navigation'
import axios from "axios";
import { guard } from '../../../../components/Guard';
import { useContext, useState, useEffect } from 'react';
import { ServiceContext } from '../../../../context/ServiceContext';
import { ApiContext } from '../../../../context/ApiContext';
import { UserContext } from '../../../../context/UserContext';

function deletarServico() {
  const router = useRouter();
  const {deleteService, getService} = useContext(ServiceContext);
  const {getPersistAuth} = useContext(UserContext);
  const [service, setService]: any = useState(getService())
  const {getJwt, apiKey} = useContext(ApiContext);


  guard();

  async function deleteServico() {
    if(!service.del) {
      if(typeof window != "undefined") {
        router.push("/servico/buscar");
        return;
      }
    }

    const user = getPersistAuth();
    const endpoint = process.env.SERVICE!;
    const infos: any = {
      headers:{
        "Authorization": "Bearer "+getJwt(),
        "Content-Type": "application/json",
        "apiKey": apiKey,
      },
      data: {
        _id: service._id,
        updatedBy: user.username,
      }
    }
    await axios.delete(endpoint, infos).then(() => {
      if (typeof window != "undefined") {
        window.localStorage.setItem("alert", JSON.stringify({ message: "Serviço deletado com sucesso!" }));
        deleteService();
        router.push("/servico/buscar");
      }
    }).catch((err) => {
      console.log(err);
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao deletar serviço.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
  }

  useEffect(() => {
    if (typeof window != "undefined") {
      if (!service) {
        router.push("/servico/buscar");
        return;
      }
    }
    deleteServico();
  }, [])

  return (
    <>
    </>
  );
}

export default deletarServico;