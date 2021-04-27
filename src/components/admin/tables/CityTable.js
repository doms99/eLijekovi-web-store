import React, {Component} from 'react';

import {Form, Table, Button, Popconfirm, Input} from 'antd';
import {BACKEND_URL} from "../../../constants";
import {DeleteOutlined, EditOutlined, SaveOutlined, StopOutlined} from '@ant-design/icons';
import {connect} from "react-redux";

const EditableCell = ({
                        editing,
                        dataIndex,
                        title,
                        inputType,
                        record,
                        index,
                        children,
                        ...restProps
                      }) => {
  let inputNode = <Input/>;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true
            },
            dataIndex === 'postalCode' ? {pattern: /[1-9][0-9]*/, message: 'Neispravan poštanski broj'} : ''
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

class CityTable extends Component {
  state = {
    modelData: [],
    editingKey: '',
    adding: false
  };

  componentDidMount() {
    fetch(`${BACKEND_URL}/city/all`, {
      headers: {
        Authorization: `Bearer ${this.props.token}`
      }
    })
      .then((response) => response.json())
      .then(async (data) => {
        console.log("table data", data)
        if (data.error) {
          alert(data.message)
        } else {
          this.setState({
            modelData: data.cities.sort((a, b) => a.id - b.id).map(city => {
              return {
                ...city,
                postalCode: city.postalcode,
                key: city.id
              }
            }),
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  deleteHandler = (row) => {
    fetch(`${BACKEND_URL}/city/${row.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        Accept: "application/json",
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.message);
        } else {
          this.setState({
            modelData: this.state.modelData.filter(e => e.id !== row.id)
          })
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  isEditing = (record) => record.key === this.state.editingKey;
  formRef = React.createRef();

  dropdownData = {}

  edit = async (record) => {
    console.log("ref", this.formRef)
    this.formRef.current.setFieldsValue({
      ...record,
    });
    this.setState({
      editingKey: record.key
    });
  };

  cancel = () => {
    this.setState({
      editingKey: ''
    });
  };

  save = async (key) => {
    const row = await this.formRef.current.validateFields();
    const newData = [...this.state.modelData];
    const index = newData.findIndex((item) => key === item.key);
    let id;
    if (index > -1) {
      const item = newData[index];
      console.log("item", item, "row", row)
      id = item.id;
      newData.splice(index, 1, {...item, ...row});
    } else {
      alert("error while saving");
      return;
    }

    console.log("newData", newData)

    const formData = {
      name: row.name,
      postalcode: row.postalCode
    }
    console.log("formData", formData)

    fetch(`${BACKEND_URL}/city/edit/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.log("data", data);
          alert(data.message)
        } else {
          this.setState({
            modelData: newData,
            editingKey: ''
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  add = async (values) => {
    console.log("values", values)

    fetch(`${BACKEND_URL}/city/create/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("data", data);
        if (data.error) {
          alert(data.message)
        } else {
          this.setState({
            modelData: [...this.state.modelData, {...data.city, postalCode: data.city.postalcode, key: data.city.id}],
            adding: false
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  render() {
    const columns = [

      {
        title: 'Id',
        dataIndex: 'id',
        key: 'id',
        sorter: (a, b) => a.id - b.id,
      },
      {
        title: 'Naziv',
        dataIndex: 'name',
        key: 'name',
        editable: true,
      },
      {
        title: 'Poštanski broj',
        dataIndex: 'postalCode',
        key: 'postalCode',
        sorter: (a, b) => a.postalCode - b.postalCode,
        editable: true,
      },
      {
        title: 'Akcija',
        key: 'operation',
        width: '5%',
        render: (_, record) => {
          const editable = this.isEditing(record);
          return editable ? (
            <div style={{display: 'flex'}}>
              <Popconfirm
                placement="topRight"
                title={'Jeste li sigurni da želite spremiti promjene?'}
                onConfirm={() => this.save(record.key)}
                okText="Da"
                cancelText="Ne"
              >
                <Button >
                  <SaveOutlined/>
                </Button>
              </Popconfirm>
              <Popconfirm
                placement="topRight"
                title={'Jeste li sigurni da želite odusatati?'}
                onConfirm={() => this.cancel()}
                okText="Da"
                cancelText="Ne"
              >
                <Button type={"primary"} danger>
                  <StopOutlined/>
                </Button>
              </Popconfirm>
            </div>
          ) : (
            <div style={{display: 'flex'}}>
              <Button disabled={this.state.editingKey !== ''} onClick={() => this.edit(record)}>
                <EditOutlined/>
              </Button>
              <Popconfirm
                placement="topRight"
                title={'Jeste li sigurni da želite obrisati ovaj zapis?'}
                onConfirm={(e) => this.deleteHandler(record, e)}
                okText="Da"
                cancelText="Ne"
              >
                <Button type={"primary"} danger>
                  <DeleteOutlined/>
                </Button>
              </Popconfirm>
            </div>
          )
        }
      }
    ];
    const mergedColumns = columns.map((col) => {
      if (!col.editable) {
        return col;
      }

      let inputType = col.dataIndex === 'postalCode' ? 'number' : 'text';
      return {
        ...col,
        onCell: (record) => ({
          record,
          inputType: inputType,
          dataIndex: col.dataIndex,
          editing: this.isEditing(record),
        }),
      };
    });
    return (
      <div className='medium'>
        <Form ref={this.formRef} component={false} >
          {this.state.adding ? (
            <Form
              onFinish={this.add}
              style={{display: 'flex'}}
            >
              <Form.Item
                name="name"
                label="Naziv"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input/>
              </Form.Item>
              <Form.Item
                name="postalcode"
                label="Poštanski broj"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input/>
              </Form.Item>
              <Form.Item >
                <Button type="primary" htmlType="submit">
                  <SaveOutlined/>
                </Button>
                <Button type="primary" onClick={() => this.setState({adding: false})} danger>
                  <StopOutlined/>
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Button style={{float: 'right', display: this.state.adding ? 'none' : 'block'}} onClick={() => this.setState({adding: true})}>Dodaj</Button>
          )}
          <Table
            components={{
              body: {
                cell: EditableCell
              }
            }}
            columns={mergedColumns}
            dataSource={this.state.modelData}
            rowClassName='editable-row'
            pagination={{
              onChange: this.cancel
            }}
          />
        </Form>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    token: state.user.token
  }
}

export default connect(mapStateToProps)(CityTable);
