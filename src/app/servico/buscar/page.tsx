"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import { useRouter } from 'next/navigation'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useEffect, useState, useContext } from "react";
import NavbarComp from "../../../../components/Navbar";
import axios from "axios";
import Dropdown from 'react-bootstrap/Dropdown';
import { guard } from "../../../../components/Guard";
import { IMaskInput } from "react-imask";
import toast, { Toaster } from 'react-hot-toast';
import { ToastVariant, ToastColor } from '../../../../components/ToastColors';
import PaginationComp from '../../../../components/Pagination';
import Loading from '../../../../components/Loading';
import { ServiceContext } from "../../../../context/ServiceContext";
import { UserContext } from "../../../../context/UserContext";
import { ApiContext } from "../../../../context/ApiContext";
import Footer from "../../../../components/Footer";

function buscarServico() {
  const router = useRouter();
  const { setService } = useContext(ServiceContext);

  const [servicos, setServicos]: any = useState([]);
  const [placa, setPlaca]: any = useState('');
  const [toastVariant, setToastVariant] = useState(ToastVariant.DEFAULT);
  const [toastColor, setToastColor] = useState(ToastColor.LIGHT);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);

  const { getPersistAuth } = useContext(UserContext);

  const [fulluser, setFulluser]: any = useState(getPersistAuth());

  const [loading, setLoading] = useState(false);
  const [loadingStyle, setLoadingStyle] = useState("");
  const { getJwt, apiKey } = useContext(ApiContext);

  const config = {
    headers: {
      "Authorization": "Bearer " + getJwt(),
      "Content-Type": "application/json",
      "apiKey": apiKey,
    }
  }

  function formatCnpjCpf(cnpjCpf: string) {
    if (cnpjCpf.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, "\$1.\$2.\$3-\$4");
    }
    return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, "\$1.\$2.\$3/\$4-\$5");
  }

  async function getPages() {
    setLoading(true)
    await axios.post(process.env.SERVICE_SEARCH!, { active: true }, config).then((res) => { setPages(res.data.totalPages) }).catch((err) => {
      const payload = {
        username: "Autosys Web",
        content: '*Erro ao buscar serviço.*\n```js\n' + JSON.stringify(err) + '\n```'
      }

      axios.post(process.env.DISCORD_WEBHOOK!, payload);
    });
    setLoading(false);
  }

  guard();

  function showToast(toastVariant: ToastVariant, toastColor: ToastColor, message: string) {
    setToastVariant(toastVariant);
    setToastColor(toastColor);
    toast(message);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.localStorage.getItem("alert")) {
        const alert = JSON.parse(window.localStorage.getItem("alert") || "{}").message;
        window.localStorage.removeItem("alert");
        showToast(ToastVariant.SUCCESS, ToastColor.DARK, alert);
      }
    }
  }, []);

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

  function editService(servico: any) {
    setLoading(true);
    Object.assign(servico, { edit: true });
    setService(servico);
    if (typeof window != "undefined") {
      router.push("/servico/editar");
    }
  }

  function deleteService(servico: any) {
    setLoading(true);
    Object.assign(servico, { del: true });
    setService(servico);
    if (typeof window != "undefined") {
      router.push("/servico/deletar");
    }
  }

  async function searchServices(page: number) {
    showToast(ToastVariant.SUCCESS, ToastColor.DARK, page > 0 ? "Buscando serviços..." : "Limpando resultados...");
    setLoading(true);
    setServicos([]);

    const endpoint = process.env.SERVICE_SEARCH!;
    var allServices: any = '';

    if (placa) {
      await axios.post(endpoint, { page, active: true, plate: placa, companyId: fulluser.companyId }, config).then(async (res) => {
        allServices = res.data.result;
        allServices = await Promise.all(allServices.map(async (v: any): Promise<object> => {
          setLoading(true);
          const cliente = await axios.post(process.env.CLIENT_SEARCH!, { active: true, "_id": v.clientId, companyId: fulluser.companyId }, config).then((res) => res.data.result[0]);
          const address = cliente.address.complement ? cliente.address.place + ", " + cliente.address.number + ", " + cliente.address.complement : cliente.address.place + ", " + cliente.address.number;

          Object.assign(v, { ownerName: cliente.name, ownerDocu: formatCnpjCpf(cliente.document), ownerAddress: address });
          setLoading(false);
          return v;
        }));

        allServices = await Promise.all(allServices.map(async (v: any): Promise<object> => {
          setLoading(true);
          const veiculo = await axios.post(process.env.VEHICLE_SEARCH!, { active: true, "_id": v.vehicleId, companyId: fulluser.companyId }, config).then((res) => res.data.result[0]);
          const vehicleTitle = veiculo.brand + " " + veiculo.model;
          Object.assign(v, { vehicleTitle: vehicleTitle, vehiclePlate: veiculo.plate, vehicleYear: veiculo.year });
          setLoading(false);
          return v;
        }));
        setLoading(false);
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar serviço.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    } if (!placa && page > 0) {
      await axios.post(endpoint, { page, active: true, companyId: fulluser.companyId }, config).then(async (res) => {
        allServices = res.data.result;
        allServices = await Promise.all(allServices.map(async (v: any): Promise<object> => {
          setLoading(true);
          await axios.post(process.env.CLIENT_SEARCH!, { active: true, "_id": v.clientId, companyId: fulluser.companyId }, config).then((res) => {
            const cliente = res.data.result[0];
            const address = cliente.address.complement ? cliente.address.place + ", " + cliente.address.number + ", " + cliente.address.complement : cliente.address.place + ", " + cliente.address.number;

            Object.assign(v, { ownerName: cliente.name, ownerDocu: formatCnpjCpf(cliente.document), ownerAddress: address });
          })
          setLoading(false);
          return v;
        }));

        allServices = await Promise.all(allServices.map(async (v: any): Promise<object> => {
          setLoading(true);
          await axios.post(process.env.VEHICLE_SEARCH!, { active: true, "_id": v.vehicleId, companyId: fulluser.companyId }, config).then((res) => {
            const veiculo = res.data.result[0];
            const vehicleTitle = veiculo.brand + " " + veiculo.model;
            Object.assign(v, { vehicleTitle: vehicleTitle, vehiclePlate: veiculo.plate, vehicleYear: veiculo.year });
          })
          setLoading(false);
          return v;
        }));
        setLoading(false);
      }).catch((err) => {
        setLoading(false);
        const payload = {
          username: "Autosys Web",
          content: '*Erro ao buscar serviço.*\n```js\n' + JSON.stringify(err) + '\n```'
        }

        axios.post(process.env.DISCORD_WEBHOOK!, payload);
      });
    }

    function compareCreatedAt(a: any, b: any) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    allServices.sort(compareCreatedAt);

    setServicos(allServices);
    setLoading(false);
  }

  useEffect(() => {
    getPages();
    searchServices(1);
  }, [])

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

        <h1 className="text-center mt-5">Busca de serviços</h1>

        <Form className="container mt-5 ">
          <div className="w-100 d-flex flex-line justify-content-center">
            <div className="w-50">
              <Form.Label>Placa do Veículo</Form.Label>
              <Form.Control as={IMaskInput} mask="*******" value={placa} onChange={(e) => { setPlaca(e.target.value.toUpperCase()) }} placeholder="Placa do veículo" />
            </div>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { searchServices(1) }} variant="primary">
              Buscar
            </Button>
            <Button className="mt-auto ms-4 d-flex align-items-center" onClick={() => { setServicos([]); setPlaca("") }} variant="warning">
              Limpar
            </Button>
          </div>
          <div className="mt-5 w-100 d-flex flex-line justify-content-center">
            {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchServices} /> : ""}
          </div>
        </Form >

        <div className="container mb-5" style={{ minHeight: "300px" }}>
          {servicos && servicos.length > 0 && servicos.map((servico: any) => {

            var pagamento = 0;
            function updateTotal() {
              let offTotal = 0;
              let total = 0;
              servico.description.forEach((v: any) => {
                let value = (Number(v.off) / 100) * Number(v.cost);
                if (Number(v.off) == 100) {
                  total += 0;
                } else {
                  offTotal += Number(value);
                  total += Number(v.cost);
                }
              });
              pagamento = (Number(total) - Number(offTotal));
            }

            updateTotal();

            function handleFormaPagamento(formaPagamento: string) {
              switch (formaPagamento) {
                case 'CREDIT':
                  return 'Cartão';

                case 'DEBIT':
                  return 'Débito';

                case 'PIX':
                  return 'PIX';

                case 'CHEQUE':
                  return 'Cheque';

                case 'CASH':
                  return 'Espécie';

                default:
                  return 'Cartão';
              }
            }

            const dataServico = new Date(servico.createdAt);
            return (
              <div key={servico._id} className="container border m-3 mt-5 p-3 w-auto rounded shadow">
                <div className="w-100 d-flex flex-line justify-content-between">
                  <h4 className="mt-2">Placa: {servico.plate}</h4>
                  <div>
                    <Dropdown>
                      <Dropdown.Toggle variant="success" id="dropdown-basic">
                        Opções
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => editService(servico)}>Editar</Dropdown.Item>
                        <hr />
                        <Dropdown.Item onClick={() => deleteService(servico)}>Deletar</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <hr />
                {servico.ownerName && servico.ownerDocu && servico.ownerAddress ? <div className="row">
                  <p className="col-md-4"><b>Cliente:</b> {servico.ownerName}</p>
                  <p className="col-md-4"><b>Documento:</b> {servico.ownerDocu}</p>
                  <p className="col-md-4"><b>Endereço:</b> {servico.ownerAddress}</p>
                </div> : ""}
                {servico.vehicleTitle && servico.vehiclePlate && servico.vehicleYear ? <div className="row">
                  <p className="col-md-4"><b>Veículo:</b> {servico.vehicleTitle}</p>
                  <p className="col-md-4"><b>Placa:</b> {servico.vehiclePlate}</p>
                  <p className="col-md-4"><b>Ano:</b> {servico.vehicleYear}</p>
                </div> : ""}
                <div className="row mt-2">
                  <p className="col-md-4"><b>Data do serviço:</b> {`${dataServico.getUTCDate() < 10 ? "0" + dataServico.getUTCDate() : dataServico.getUTCDate()}/${dataServico.getUTCMonth() + 1 < 10 ? "0" + (dataServico.getUTCMonth() + 1).toString() : dataServico.getUTCMonth() + 1}/${dataServico.getFullYear()}`}</p>
                  <p className="col-md-4"><b>Total: </b> {pagamento.toLocaleString("pt-BR", {
                    style: 'currency',
                    currency: 'BRL',
                  })}</p>
                  <p className="col-md-4"><b>Forma de Pagamento:</b> {handleFormaPagamento(servico.paymentForm)}</p>
                </div>
                {servico.paymentDetail ? <div className="row">
                  <p className="col-md-12"><b>Detalhes do Pagamento:</b> {servico.paymentDetail}</p>
                </div> : ""}
                {servico.description && servico.description.length > 0 ? <><hr /><h5>Itens do serviço</h5></> : ""}
                {servico.description && servico.description.map((desc: any) => {
                  const garantia = new Date(desc.warranty);
                  const value = parseFloat(desc.cost) - (Number(desc.off) / 100) * parseFloat(desc.cost);

                  const cost = value.toLocaleString("pt-BR", {
                    style: 'currency',
                    currency: 'BRL',
                  })

                  return <div className="row border mb-2 ms-1 me-1 pt-3">
                    <p className="col-md-3"><b>Descrição:</b> {desc.description}</p>
                    <p className="col-md-3"><b>Garantia:</b> {garantia.toString() == "Invalid Date" ? "Sem Garantia" : `${garantia.getUTCDate() + 1 < 10 ? "0" + garantia.getUTCDate() : garantia.getUTCDate()}/${garantia.getUTCMonth() + 1 < 10 ? "0" + (garantia.getUTCMonth() + 1).toString() : garantia.getUTCMonth() + 1}/${garantia.getFullYear()}`}</p>
                    <p className="col-md-3"><b>Desconto:</b> {desc.off ? `${desc.off}%` : "Sem desconto"}</p>
                    <p className="col-md-3"><b>Preço: </b> {cost}</p>
                  </div>
                })}
              </div>
            )
          })}
        </div>
        <div className="mt-5 w-100 d-flex flex-line justify-content-center">
          {pages != 0 ? <PaginationComp page={page} setPage={setPage} pages={pages} search={searchServices} /> : ""}
        </div>
      </div>
    </>
  );
}

export default buscarServico;
