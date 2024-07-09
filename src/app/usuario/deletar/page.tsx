"use client";

import { useRouter } from 'next/navigation'
import axios from "axios";
import jwt from 'jwt-decode';
import { useEffect, useState, useContext } from 'react';
import { guard } from "../../../../components/Guard";
import { ClientContext } from '../../../../context/ClientContext';
import { UserContext } from '../../../../context/UserContext';
import { ApiContext } from '../../../../context/ApiContext';

function deletarCliente() {
  const router = useRouter();
  guard();

  const {deleteClient, getClient} = useContext(ClientContext);
  const {getPersistAuth} = useContext(UserContext);

  const [cliente, setClient]: any = useState(getClient());
  const [fulluser, setFulluser] = useState(getPersistAuth);

  const {getJwt, apiKey} = useContext(ApiContext);
  const config = {
    headers:{
      "Authorization": "Bearer "+getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  async function deleteSelectedClient() {
    var infos: any = {
      _id: cliente._id,
      updatedBy: fulluser.username,
    }
  
    await axios.post(process.env.CLIENT_DISABLE!, infos, config).then(() => {
      if (typeof window != "undefined") {
        window.localStorage.setItem("alert", JSON.stringify({ message: "Cliente deletado com sucesso!" }));
        deleteClient();
        router.push("/cliente/buscar");
      }
    }).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao deletar cilente.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
  }

  useEffect(() => {
    if (typeof window != "undefined") {
      if (!cliente) {
        router.push("/cliente/buscar");
        return;
      }
    }
    deleteSelectedClient();
  }, [])

  return (
    <>
    </>
  );
}

export default deletarCliente;