const input = document.getElementById("urlInput");
const button = document.getElementById("parseBtn");
const result = document.getElementById("result");


button.addEventListener("click", parseURL);



function parseURL() {

  try {

    let value = input.value.trim();


    if (!value) {
      throw new Error("Empty URL");
    }


    // Add protocol if user enters example.com
    if (!value.startsWith("http://") && 
        !value.startsWith("https://") &&
        !value.startsWith("ftp://") &&
        !value.startsWith("mailto:") &&
        !value.startsWith("tel:")) {

      value = "https://" + value;

    }


    const url = new URL(value);



    const pathname = url.pathname;



    const filename =
      pathname
        .split("/")
        .filter(Boolean)
        .pop()
        || "None";



    const extension =
      filename.includes(".")
        ? filename
            .split(".")
            .pop()
            .toLowerCase()
        : "None";



    const directory =
      pathname.substring(
        0,
        pathname.lastIndexOf("/")
      ) || "/";



    const queryParams = [];


    url.searchParams.forEach((value, key) => {

      queryParams.push({
        key,
        value
      });

    });



    const data = {


      // General

      Type:
        detectURLType(url, extension),


      FullURL:
        url.href,


      URLLength:
        `${url.href.length} characters`,



      // Security

      Secure:
        url.protocol === "https:"
          ? "Yes"
          : "No",



      // Protocol

      Protocol:
        url.protocol.replace(":", ""),



      // Domain

      Origin:
        url.origin,


      Host:
        url.host,


      Hostname:
        url.hostname,


      Port:
        url.port || "Default",



      // Authentication

      Username:
        url.username || "None",


      Password:
        url.password
          ? "******"
          : "None",



      // Path

      Path:
        pathname,


      Directory:
        directory,


      Filename:
        filename,


      Extension:
        extension,


      FileType:
        detectFileType(extension),



      // Query

      Search:
        url.search || "None",



      // Fragment

      Fragment:
        url.hash.replace("#", "")
        || "None"

    };



    result.innerHTML = "";



    Object.entries(data)
      .forEach(([key, value]) => {

        createRow(key, value);

      });



    // Query parameters section

    if (queryParams.length) {


      result.innerHTML +=
      `
      <h3 class="section-title">
        Query Parameters
      </h3>
      `;


      queryParams.forEach(param => {


        createRow(
          param.key,
          param.value
        );


      });

    }


  }


  catch(error) {


    result.innerHTML =
    `
    <p class="error">
       Invalid URL
    </p>
    `;


  }

}





function createRow(label, value) {


  const div = document.createElement("div");


  div.className = "item";



  div.innerHTML = `

    <strong>${label}</strong>


    <input
      class="value"
      value="${escapeHTML(value)}"
    />


    <button class="copy">
       Copy
    </button>

  `;



  const copyButton =
    div.querySelector(".copy");



  const inputField =
    div.querySelector(".value");



  copyButton.addEventListener(
    "click",
    () => {


      navigator.clipboard.writeText(
        inputField.value
      );


      copyButton.innerText =
        " Copied";


      setTimeout(() => {

        copyButton.innerText =
          " Copy";

      },1000);


    }
  );



  result.appendChild(div);

}





function detectFileType(extension) {


  const images = [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "svg",
    "avif"
  ];


  const videos = [
    "mp4",
    "webm",
    "mov",
    "mkv"
  ];


  const documents = [
    "pdf",
    "doc",
    "docx",
    "txt"
  ];



  if(images.includes(extension))
    return "Image ";


  if(videos.includes(extension))
    return "Video ";


  if(documents.includes(extension))
    return "Document ";


  return "Unknown";

}



function detectURLType(url, extension) {


  if(
    ["png","jpg","jpeg","gif","webp","svg"]
      .includes(extension)
  ) {

    return "Image URL";

  }



  if(
    ["mp4","webm","mov"]
      .includes(extension)
  ) {

    return "Video URL";

  }



  if(
    url.hostname.includes("api")
  ) {

    return "API Endpoint";

  }



  if(
    url.hostname.includes("github.com")
  ) {

    return "GitHub URL";

  }



  if(
    url.hostname.includes("youtube.com")
    ||
    url.hostname.includes("youtu.be")
  ) {

    return "YouTube URL";

  }



  if(url.protocol === "ftp:")
  {
    return "FTP URL";
  }



  if(url.protocol === "mailto:")
  {
    return "Email URL";
  }



  return "Website URL";

}





function escapeHTML(value) {


  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}