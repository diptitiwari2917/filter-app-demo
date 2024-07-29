import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Button, Checkbox, Collapse, Layout, Select, Table, Tag, Typography } from 'antd';
import { data, filterFields, tagsColor } from './dataFiles'; // Import your data and filter fields
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Schema } from "./schema";
import { SchemaKeys } from "./types"; // Icons for display

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Content, Sider } = Layout;

const App: React.FC = () => {
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Handle filter changes
  const handleFilterChange = (field: string, values: (string | boolean)[]) => {
    setFilters((prev) => ({ ...prev, [field]: values.map(val => val.toString().toLowerCase()) }));
  };

  // Handle Select changes
  const handleSelectChange = (values: string[]) => {
    const newFilters: { [key: string]: string[] } = {};
    values.forEach((item) => {
      const [field, filterValue] = item.split(':');
      if (!newFilters[field]) {
        newFilters[field] = [];
      }
      newFilters[field].push(filterValue.toLowerCase());
    });
    setFilters(newFilters);
    setSelectedFilters(values);
  };

  // Update selected filters based on the current filter state
  useEffect(() => {
    const newSelectedFilters: string[] = [];
    Object.entries(filters).forEach(([field, values]) => {
      values.forEach((value) => {
        newSelectedFilters.push(`${field}:${value}`);
      });
    });
    setSelectedFilters(newSelectedFilters);
  }, [filters]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter((item: Schema) => {
      return Object.entries(filters).every(([field, values]) => {
        if (!values || !values.length) return true;

        // Type assertion to ensure field exists on Schema
        const typedField = field as keyof Schema;

        if (Array.isArray(values)) {
          return values.some((value) => {
            // Convert item value to string and lowercase
            const itemValue = (item[typedField] as string | boolean | string[] | boolean[]).toString().toLowerCase();

            if (Array.isArray(item[typedField])) {
              return (item[typedField] as (string | boolean)[]).some(val =>
                val.toString().toLowerCase() === value
              );
            }

            return itemValue === value;
          });
        }

        // Handle non-array values
        return (item[typedField] as string | boolean).toString().toLowerCase() === values[0].toString().toLowerCase();
      });
    });
  }, [filters]);

  const getCountByField = useCallback(<T extends SchemaKeys>(field: T, value: string | boolean) => {
    const lowercasedValue = value.toString().toLowerCase();
    return filteredData.filter((item) => {
      const itemValue = item[field];
      if (Array.isArray(itemValue)) {
        return (itemValue as (string | boolean)[]).some(val =>
          val.toString().toLowerCase() === lowercasedValue
        );
      }
      return itemValue.toString().toLowerCase() === lowercasedValue;
    }).length;
  }, [filteredData]);

  // Get all filter options for the Select component
  const getAllOptions = useMemo(() => {
    return filterFields.flatMap((field) =>
      field.options?.map((option) => ({
        label: `${field.label}: ${option.label}`,
        value: `${field.value}:${option.value}`,
      })) || []
    );
  }, []);

  // Clear a specific filter
  const clearFilter = (field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  // Table columns definition
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Public',
      dataIndex: 'public',
      key: 'public',
      render: (value: boolean) => (value ? 'True' : 'False'),
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (value: boolean) => (value ? 'True' : 'False'),
    },
    {
      title: 'Regions',
      dataIndex: 'regions',
      key: 'regions',
      render: (regions: string[]) => regions.join(', '),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => tags.map((tag) => (
        <Tag
          key={tag}
          color={tagsColor[tag].badge}
          style={{ marginRight: 5 }}
        >
          {tag}
        </Tag>
      )),
    },
    {
      title: 'Public',
      dataIndex: 'public',
      key: 'public',
      render: (value: boolean) => (
        value ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (value: boolean) => (
        value ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />
      ),
    },
  ];

  // Get all panel keys for defaultActiveKey
  const allPanelKeys = filterFields.map((field) => field.value);

  return (
    <Layout>
      <Content style={{ padding: '0 24px' }} className="w-100">
        <Layout style={{ padding: '12px 0', height: '100vh' }}>
          <Sider width={300} style={{ background: "white", padding: "0 20px" }}>
            <Title level={4}>Filters</Title>

            <Collapse defaultActiveKey={allPanelKeys} >
              {filterFields.map((field) => (
                <Panel header={field.label} key={field.value}>
                  {field.options?.map((option) => (
                    <div key={option.value} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}>
                      <Checkbox
                        value={option.value}
                        checked={(filters[field.value] || []).includes(option.value.toString().toLowerCase())}
                        onChange={() => handleFilterChange(field.value, (filters[field.value] || []).includes(option.value.toString().toLowerCase()) ? (filters[field.value] || []).filter(v => v !== option.value.toString().toLowerCase()) : [...(filters[field.value] || []), option.value.toString().toLowerCase()])}
                      >
                        {option.label}
                      </Checkbox>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {field.component ? <field.component {...option} /> : null}
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {getCountByField(field.value, option.value)}
                        </Text>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="link"
                    onClick={() => clearFilter(field.value)}
                    className="d-block mt-3"
                  >
                    Clear Filters
                  </Button>
                </Panel>
              ))}
            </Collapse>

          </Sider>
          <Content style={{ padding: "48px" }}>
            <Select
              mode="multiple"
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="Select filters (e.g., public:true)"
              value={selectedFilters}
              onChange={handleSelectChange}
              options={getAllOptions}
              className="w-100"
            />
            <Table columns={columns} dataSource={filteredData} rowKey="name" />
            <span>{filteredData.length} of {data.length}</span>
          </Content>
        </Layout>
      </Content>
    </Layout>
  );
};

export default App;
