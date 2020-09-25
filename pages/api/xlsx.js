import xlsx from "node-xlsx";

export default (req, res) => {
  const { data, filename } = req.body;

  const buffer = xlsx.build([{ name: "Sheet 1", data }]);

  res.setHeader("Content-disposition", `attachment; filename=${filename}`);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(buffer);
};
