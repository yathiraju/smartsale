import React from "react";
import Select from "react-select";

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry"
];

const options = STATES.map(s => ({ label: s, value: s }));

export default function IndiaStateSelect({ value, onChange }) {
  return (
    <Select
      options={options}
      value={options.find(o => o.value === value) || null}
      onChange={(opt) => onChange(opt?.value || "")}
      placeholder="Select State"
      isSearchable
      styles={{
        control: (base) => ({
          ...base,
          minHeight: 42,
          borderColor: "#cbd5e1",
          boxShadow: "none",
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
    />
  );
}
