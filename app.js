// Data base Initialization

const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000/");
});
initializeDBAndServer();

// API's

// 1.List of all states in state table

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state ORDER BY state_id`;
  const dbResponse = await db.all(getStatesQuery);
  const updatedStatesArray = dbResponse.map((state) => {
    return {
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    };
  });
  response.send(updatedStatesArray);
});

// 2.Get a state by its Id

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id=${stateId}`;
  const dbResponse = await db.get(getStateQuery);
  const updatedState = {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };

  response.send(updatedState);
});

// Create a new district in the district table

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
                            VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;

  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

// Get a district details based on districtId

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district WHERE district_id=${districtId}`;
  const dbResponse = await db.get(getDistrictQuery);
  const district = {
    districtId: dbResponse.district_id,
    districtName: dbResponse.district_name,
    stateId: dbResponse.state_id,
    cases: dbResponse.cases,
    cured: dbResponse.cured,
    active: dbResponse.active,
    deaths: dbResponse.deaths,
  };

  response.send(district);
});

// Delete a district based on the district_id

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// Update a district based on its id

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `UPDATE district SET district_name='${districtName}', state_id='${stateId}',
                                  cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}'`;

  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// statistics based on state_id

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT 
                            SUM(cases), 
                            SUM(cured),
                            SUM(active), 
                            SUM(deaths)
                            FROM 
                            district 
                            WHERE state_id=${stateId}`;
  const dbResponse = await db.get(getStatsQuery);
  console.log(dbResponse);
  const stats = {
    totalCases: dbResponse["SUM(cases)"],
    totalCured: dbResponse["SUM(cured)"],
    totalActive: dbResponse["SUM(active)"],
    totalDeaths: dbResponse["SUM(deaths)"],
  };

  response.send(stats);
});

// Get a state name using district_id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `SELECT 
                             state.state_name AS stateName
                            FROM state INNER JOIN 
                            district ON state.state_id=district.state_id 
                            WHERE district.district_id=${districtId}`;
  const dbResponse = await db.get(getStateNameQuery);
  console.log(dbResponse);

  response.send(dbResponse);
});

module.exports = app;
