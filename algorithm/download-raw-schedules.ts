import fs from "fs";
import seedrandom from "seedrandom";

const SOURCE_BASE_URL =
  "https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1";

const ALL_4_YEARS = [1, 2, 3, 4];
const ALL_3_YEARS = [1, 2, 3];
const ACAD_SEM = "2025;1";

type CourseSource = {
  name: string;
  code: string;
  subCodes?: string[];
  years: number[];
};

const COURSE_SOURCES: CourseSource[] = [
  { name: "Computer Science", code: "CSC", years: ALL_4_YEARS },
  {
    name: "Data Science and Artificial Intelligence",
    code: "DSAI",
    years: ALL_4_YEARS,
  },
  { name: "Arts, Design and Media", code: "ADM", years: [1] },
  {
    name: "Arts, Design and Media",
    code: "ADM",
    subCodes: ["DA", "MA"],
    years: [2, 3, 4],
  },
];

const rng = seedrandom("1234567890");

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createFormData(code: string, year: number, subCode?: string) {
  return {
    acadsem: ACAD_SEM,
    r_subj_code: "Enter+Keywords+or+Course+Code",
    r_search_type: "F",
    boption: "CLoad",
    staff_access: "false",
    r_course_yr: subCode
      ? `${code};${subCode};${year};F`
      : `${code};;${year};F`,
  };
  //   const formData = new FormData();
  //   formData.append("acadsem", ACAD_SEM);
  //   formData.append("r_subj_code", "Enter+Keywords+or+Course+Code");
  //   formData.append("r_search_type", "F");
  //   formData.append("boption", "CLoad");
  //   formData.append("staff_access", "false");
  //   if (subCode) {
  //     formData.append("r_course_yr", `${code};${subCode};${year};F`);
  //   } else {
  //     formData.append("r_course_yr", `${code};;${year};F`);
  //   }
  //   return formData;
}

async function loadCourseSources(
  courseSources: CourseSource[],
  options: {
    dir: string;
    gapBetweenRequests: [number, number];
  }
) {
  const wait = async () => {
    const gapBetweenRequests =
      rng.quick() *
        (options.gapBetweenRequests[1] - options.gapBetweenRequests[0]) +
      options.gapBetweenRequests[0];
    await sleep(gapBetweenRequests);
  };

  for (const courseSource of courseSources) {
    const { code, subCodes, years } = courseSource;
    for (const year of years) {
      if (subCodes && subCodes.length > 0) {
        for (const subCode of subCodes) {
          const formData = createFormData(code, year, subCode);
          const url = new URL(SOURCE_BASE_URL);
          url.search = new URLSearchParams(formData).toString();
          console.log(`Fetching ${url.toString()}`);
          const response = await fetch(url, {
            method: "POST",
          });
          const html = await response.text();
          const filePath = `${options.dir}/${courseSource.name} (${subCode}) Year ${year} ${subCode}.html`;
          fs.writeFileSync(filePath, html);
          await wait();
        }
        continue;
      }
      const formData = createFormData(code, year);
      const url = new URL(SOURCE_BASE_URL);
      url.search = new URLSearchParams(formData).toString();
      console.log(`Fetching ${url.toString()}`);
      const response = await fetch(url, {
        method: "POST",
      });
      const html = await response.text();
      const filePath = `${options.dir}/${courseSource.name} Year ${year}.html`;
      fs.writeFileSync(filePath, html);
      await wait();
      // https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1?acadsem=2025;1&r_course_yr=ECDS;;1111;F&r_subj_code=Enter+Keywords+or+Course+Code&r_search_type=F&boption=CLoad&staff_access=false
    }
    //   const url = `https://wish.wis.ntu.edu.sg/webexe/owa/AUS_SCHEDULE.main_display1?acadsem=${ACAD_SEM}&r_course_yr=ECDS;;1111;F&r_subj_code=${code}&r_search_type=F&boption=CLoad&staff_access=false`;
    // //   const url = `https://www.nus.edu.sg/registrar/academic-calendar/course-information/course-details?acad_year=${ACAD_SEM}&course_code=${code}`;
    //   const response = await fetch(url);
    //   const html = await response.text();
    //   console.log(html);
  }
}

// Create folder "raw-schedules" if not exist
if (!fs.existsSync("raw-schedules")) {
  fs.mkdirSync("raw-schedules");
}

// Do a fetch for each course source
(async () => {
  await loadCourseSources(COURSE_SOURCES, {
    // Dont dox NTU and raise suspicion lmao.
    gapBetweenRequests: [500, 2000],
    dir: "raw-schedules",
  });
})();
