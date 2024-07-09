"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import NavbarComp from "../../../../components/Navbar";
import Dropdown from 'react-bootstrap/Dropdown';
import { guard } from "../../../../components/Guard/index";
import { IMaskInput } from "react-imask";
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../../components/ToastColors';
import PaginationComp from '../../../../components/Pagination';
import Loading from '../../../../components/Loading';
import { VehicleContext } from "../../../../context/VehicleContext";
import { UserContext } from "../../../../context/UserContext";
import { ApiContext } from "../../../../context/ApiContext";
import Footer from "../../../../components/Footer";

function buscarVeiculos() {
  const { setVehicle } = useContext(VehicleContext);

  const router = useRouter();
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");

  const { getPersistAuth } = useContext(UserContext);

  const [fulluser, setFulluser]: any = useState(getPersistAuth());
  const { getJwt, apiKey } = useContext(ApiContext);
  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  guard();

  async function getPages() {
    setLoading(true);
    await axios.post(process.env.SERVICE_SEARCH!, { active: true }, config).then((res) => { setPages(res.data.totalPages) }).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar serviço.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
    setLoading(false);
  }

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        const alert = JSON.parse(window.localStorage.getItem("alert") || "{}").message;
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, alert);
        window.localStorage.removeItem("alert");
      }
    }
  }, []);

  const [placa, setPlaca] = useState('');
  const [veiculos, setVeiculos]: any = useState([]);

  const navbarperms = [
    {
      title: "Cliente",
      opts: [
        { label: "Cadastrar", url: "/cliente" },
        { label: "Buscar", url: "/cliente/buscar" },
      ]
    },
    {
      title: "Veículo",
      opts: [
        { label: "Cadastrar", url: "/veiculo" },
        { label: "Buscar", url: "/veiculo/buscar" },
      ]
    },
    {
      title: "Serviço",
      opts: [
        { label: "Cadastrar", url: "/servico" },
        { label: "Buscar", url: "/servico/buscar" },
      ]
    }
  ];

  async function searchVehicle(page: number) {
    showToast(ToastVariant.SUCCESS, ToastColor.DARK, page > 0 ? "Buscando veículos..." : "Limpando resultados...");
    setLoading(true);
    setVeiculos([]);

    function formatCnpjCpf(cnpjCpf: string) {
      if (cnpjCpf.length === 11) {
        return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
      }
      return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
    }

    const endpoint = process.env.VEHICLE_SEARCH!;
    var vehicles: any = '';

    if (placa) {
      vehicles = await axios.post(endpoint, { page, active: true, plate: placa, companyId: fulluser.companyId }, config).then(async (res) => {
        let valor = res.data.result;

        valor = await Promise.all(valor.map(async (v: any): Promise<object> => {
          const cliente = await axios.post(process.env.CLIENT_SEARCH!, { active: true, "_id": v.clientId, companyId: fulluser.companyId }, config).then((res) => res.data.result[0]);
          Object.assign(v, { ownerName: cliente.name, ownerDocu: formatCnpjCpf(cliente.document), ownerAddress: cliente.address.place + ", " + cliente.address.number });
          return v;
        }));

        setLoading(false);
        return valor;
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar veículo.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }
    if (!placa && page > 0) {
      vehicles = await axios.post(endpoint, { page, active: true, companyId: fulluser.companyId }, config).then(async (res) => {
        let valor = res.data.result;

        valor = await Promise.all(valor.map(async (v: any): Promise<object> => {
          setLoading(true);
          await axios.post(process.env.CLIENT_SEARCH!, { active: true, "_id": v.clientId, companyId: fulluser.companyId }, config).then((res) => {
            const cliente = res.data.result[0];
            const address = cliente.address.complement ? cliente.address.place + ", " + cliente.address.number + ", " + cliente.address.complement : cliente.address.place + ", " + cliente.address.number;
            Object.assign(v, { ownerName: cliente.name, ownerDocu: formatCnpjCpf(cliente.document), ownerAddress:  address});
          })
          setLoading(false);
          return v;
        }));

        setLoading(false);
        return valor;
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar veículo.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }

    function compareNames(a: any, b:any) {
      const plateA = a.plate.toUpperCase();
      const plateB = b.plate.toUpperCase();
  
      if (plateA < plateB) {
          return -1;
      }
      if (plateA > plateB) {
          return 1;
      }
      return 0;
    }

    vehicles.sort(compareNames);

    setVeiculos(vehicles);
    setLoading(false);
  }

  useEffect(() => {
    getPages();
    searchVehicle(1);
  }, [])

  function createService(vehicle: any) {
    setLoading(true);
    axios.post(process.env.CLIENT_SEARCH!, { _id: vehicle.clientId }, config).then((res) => {
      const document = res.data.result[0].document;
      Object.assign(vehicle, { fill: true, clientDocument: document });
      setVehicle(vehicle);
      if (typeof window != "undefined") {
        router.push("/servico")
      }
    }).catch(() => {
      setLoading(false);
      showToast(ToastVariant.ERROR, ToastColor.LIGHT, "Não foi possível encontrar o cliente através desse veículo");
    })
  }

  function editVehicle(vehicle: any) {
    setLoading(true);
    Object.assign(vehicle, { edit: true })
    setVehicle(vehicle);
    if (typeof window != "undefined") {
      router.push("/veiculo/editar");
    }
  }

  function deleteVehicle(vehicle: any) {
    setLoading(true);
    Object.assign(vehicle, { del: true })
    setVehicle(vehicle);
    if (typeof window != "undefined") {
      router.push("/veiculo/deletar");
    }
  }

  async function searchVehicleServices(plate: string) {
    const infos = { plate, active: true }
    const results = axios.post(process.env.SERVICE_SEARCH!, infos, config).then((res) => {
      return res.data.result;
    })

    return results;
  }

  let toastOptions = {
    className: '',
    duration: Number(process.env.TOAST_TIME!),
    style: {
      background: toastVariant,
      color: toastColor,
    }
  }

  return (
    <>
      {loading ? <Loading setLoadingStyle={setLoadingStyle} /> : ""}

      <div className="w-100 d-flex justify-content-center">
        <Toaster toastOptions={toastOptions} />
      </div>

      <div className={loading ? loadingStyle : ""} >
        <NavbarComp perms={navbarperms} />

        <h1 className="text-center mt-5">Buscar Veículo</h1>

        <Form className="container mt-5">
          <div className="w-100 d-flex flex-line justify-content-center">
            <div className="w-50">
              <Form.Label>Placa do veículo</Form.Label>
              <Form.Control as={IMaskInput} mask="*******" value={placa} onChange={(e) => { setPlaca(e.target.value.toUpperCase()) }} placeholder="Placa do veículo" />
            </div>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { searchVehicle(1) }} variant="primary">
              Buscar
            </Button>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { setVeiculos([]); setPlaca("") }} variant="warning">
              Limpar
            </Button>
          </div>
          <div className="mt-5 w-100 d-flex flex-line justify-content-center">
            {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchVehicle} /> : ""}
          </div>
        </Form >

        <div className="container mb-5" style={{ minHeight: "300px" }}>
          {veiculos && veiculos.map((veiculo: any) => {
            return (
              <div key={veiculo._id} className="container border mt-5 m-3 p-4 w-auto rounded shadow">
                <div className="w-100 d-flex flex-line justify-content-between">
                  <h4 className="mt-2">{veiculo.brand} {veiculo.model}</h4>
                  <div>
                    <Dropdown>
                      <Dropdown.Toggle variant="success" id="dropdown-basic">
                        Opções
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => createService(veiculo)}>Cadastrar Serviço</Dropdown.Item>
                        <Dropdown.Item onClick={() => editVehicle(veiculo)}>Editar</Dropdown.Item>
                        <hr />
                        <Dropdown.Item onClick={async () => {
                          const servicos = await searchVehicleServices(veiculo.plate);
                          if (servicos.length > 0) {
                            showToast(ToastVariant.ERROR, ToastColor.LIGHT, "O veículo ainda possui serviços em andamento")
                            return;
                          }

                          deleteVehicle(veiculo)
                        }}>Deletar</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <hr />
                <div className="row mb-2">
                  <p className="col-md-4"><b>Cor:</b> {veiculo.color}</p>
                  <p className="col-md-4"><b>Ano:</b> {veiculo.year}</p>
                  <p className="col-md-4"><b>Placa:</b> {veiculo.plate}</p>
                </div>
                {veiculo.ownerName && veiculo.ownerDocu && veiculo.ownerAddress ? <div className="row">
                  <p className="col-md-4"><b>Cliente:</b> {veiculo.ownerName}</p>
                  <p className="col-md-4"><b>Documento:</b> {veiculo.ownerDocu}</p>
                  <p className="col-md-4"><b>Endereço:</b> {veiculo.ownerAddress}</p>
                </div> : ""}
                <div className="row">
                  <p className="col-md-12"><b>Observações: </b></p>
                  <Form.Control value={veiculo.Observations} as="textarea" rows={5} readOnly={true} />
                </div>
              </div>
            )
          })}
        </div >
        <div className="mt-5 w-100 d-flex flex-line justify-content-center">
          {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchVehicle} /> : ""}
        </div>
      </div>
    </>
  );
}

export default buscarVeiculos;
