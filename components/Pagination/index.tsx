import "bootstrap/dist/css/bootstrap.min.css";
import Pagination from 'react-bootstrap/Pagination';
import { useState } from 'react';

const PaginationComp = (props: any) => {
  const [pages, setPages] = useState(props.pages)

  return (
    <Pagination>
      <Pagination.First onClick={() => { props.setPage(1); props.search(1) }} />
      <Pagination.Prev onClick={() => { if (props.page > 1) { props.setPage(props.page - 1); props.search(props.page - 1) } }} />
      {props.page - 4 >= 1 && pages >= 4 ? <Pagination.Item onClick={() => { props.setPage(props.page - 4); props.search(props.page - 4) }}>{props.page - 4}</Pagination.Item> : ''}
      {props.page - 3 >= 1 && pages >= 3 ? <Pagination.Item onClick={() => { props.setPage(props.page - 3); props.search(props.page - 3) }}>{props.page - 3}</Pagination.Item> : ''}
      {props.page - 2 >= 1 && pages >= 2 ? <Pagination.Item onClick={() => { props.setPage(props.page - 2); props.search(props.page - 2) }}>{props.page - 2}</Pagination.Item> : ''}
      {props.page - 1 >= 1 && pages >= 1 ? <Pagination.Item onClick={() => { props.setPage(props.page - 1); props.search(props.page - 1) }}>{props.page - 1}</Pagination.Item> : ''}
      {props.page - 1 >= 1 && pages >= 1 ? <Pagination.Ellipsis /> : ''}
      <Pagination.Item onClick={() => { props.search(props.page) }}>{props.page}</Pagination.Item>
      {props.page + 1 <= pages ? <Pagination.Ellipsis /> : ''}
      {props.page + 1 <= pages ? <Pagination.Item onClick={() => { props.setPage(props.page + 1); props.search(props.page + 1) }}>{props.page + 1}</Pagination.Item> : ''}
      {props.page + 2 <= pages ? <Pagination.Item onClick={() => { props.setPage(props.page + 2); props.search(props.page + 2) }}>{props.page + 2}</Pagination.Item> : ''}
      {props.page + 3 <= pages ? <Pagination.Item onClick={() => { props.setPage(props.page + 3); props.search(props.page + 3) }}>{props.page + 3}</Pagination.Item> : ''}
      {props.page + 4 <= pages ? <Pagination.Item onClick={() => { props.setPage(props.page + 4); props.search(props.page + 4) }}>{props.page + 4}</Pagination.Item> : ''}
      <Pagination.Next onClick={() => { if (pages >= props.page + 1) { props.setPage(props.page + 1); props.search(props.page + 1) } }} />
      <Pagination.Last onClick={() => { props.setPage(pages); props.search(pages) }} />
    </Pagination>
  )
}

export default PaginationComp;
