import { Autocomplete, TextField } from "@mui/material";
import type { StudentProfile } from "@/modules/universities/universities.types";
import { resolveStudentSelection } from "@/modules/universities/studentEligibility";

type StudentSearchFieldProps = {
  onChange: (student: StudentProfile | null) => void;
  students: StudentProfile[];
  value: StudentProfile | null;
};

export function StudentSearchField({ onChange, students, value }: StudentSearchFieldProps) {
  return (
    <Autocomplete
      freeSolo
      clearOnBlur={false}
      handleHomeEndKeys
      options={students}
      sx={{ minWidth: { xs: "100%", md: 220 } }}
      value={value}
      getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
      isOptionEqualToValue={(option, selected) =>
        (typeof option === "string" ? option : option.id) ===
        (typeof selected === "string" ? selected : selected?.id)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search or enter student name"
          size="small"
          label="Searching for"
        />
      )}
      onChange={(_, newValue) => {
        onChange(resolveStudentSelection(newValue, students));
      }}
    />
  );
}
