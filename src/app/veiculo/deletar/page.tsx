"use client";

import { useRouter } from 'next/navigation'
import { useEffect, useState, useContext } from 'react';
import axios from "axios";
import jwt from 'jwt-decode';
import { guard } from "../../../../components/Guard/index";
import { VehicleContext } from '../../../../context/VehicleContext';
import { ApiContext } from '../../../../context/ApiContext';

function deletarVeiculo() {
  const router = useRouter();

  const {deleteVehicle, getVehicle} = useContext(VehicleContext);
  const [vehicle, setVehicle]: any = useState(getVehicle())
  const {getJwt, apiKey} = useContext(ApiContext);

  guard();

  async function deleteSelectedVehicle() {
    if(!vehicle.del){
      if (typeof window != "undefined") {
        router.push("/veiculo/buscar");
        return;
      }
    }
    const infos: any = {
      headers:{
        "Authorization": "Bearer "+getJwt(),
        "Content-Type": "application/json",
        "apiKey": apiKey,
      },
      data: {
        _id: vehicle._id,
      }
    }

    await axios.delete(process.env.VEHICLE!, infos).then(() => {
      if (typeof window != "undefined") {
        window.localStorage.setItem("alert", JSON.stringify({ message: "Veículo deletado com sucesso!" }));
        deleteVehicle();
        router.push("/veiculo/buscar");
      }
    }).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao deletar veículo.*\n```js\n' +JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });

  }

  useEffect(() => {
    if (typeof window != "undefined") {
      if (!vehicle) {
        router.push("/veiculo/buscar");
        return;
      }
    }
    deleteSelectedVehicle();
  }, [])

  return (
    <>
    </>
  );
}

export default deletarVeiculo;