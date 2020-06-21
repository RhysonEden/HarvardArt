const BASE_URL = "https://api.harvardartmuseums.org";

const KEY = "apikey=eb62a7c0-792a-11ea-8d99-bbaa4d38f64a";

async function fetchObjects() {
  const url = `${BASE_URL}/object?${KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
}

async function fetchAllCenturies() {
  const url = `${BASE_URL}/century?${KEY}&size=100&sort=temporalorder`;
  let sideBar = localStorage.getItem("centuries");
  if (typeof sideBar !== "undefined" && sideBar !== null) {
    if (sideBar) {
      return JSON.parse(localStorage.getItem("centuries"));
    }
  } else {
    localStorage.clear();
  }
  try {
    const response = await fetch(url);
    const { records } = await response.json();
    localStorage.setItem("centuries", JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error);
  }
}

async function fetchAllClassifications() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;
  let sideBar = localStorage.getItem("classifications");
  if (typeof sideBar !== "undefined" && sideBar !== null) {
    if (sideBar) {
      return JSON.parse(localStorage.getItem("classifications"));
    }
  } else {
    localStorage.clear();
  }
  try {
    const response = await fetch(url);
    const { records } = await response.json();
    localStorage.setItem("centuries", JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error);
  }
}

async function prefetchCategoryLists() {
  try {
    const [classifications, centuries] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies(),
    ]);

    $(".classification-count").text(`(${classifications.length})`);
    classifications.forEach((classification) => {
      $("#select-classification").append(
        $(
          `<option value="${classification.name}">${classification.name}</option>`
        )
      );
    });

    $(".century-count").text(`(${centuries.length})`);
    centuries.forEach((century) => {
      $("#select-century").append(
        $(`<option value="${century.name}">${century.name}</option>`)
      );
    });
  } catch (error) {
    console.error(error);
  }
}

function buildSearchString() {
  const base = `${BASE_URL}/object?${KEY}`;

  const terms = [...$("#search select")]
    .map((el) => {
      return `${$(el).attr("name")}=${$(el).val()}`;
    })
    .join("&");

  const keywords = `keyword=${$("#keywords").val()}`;

  return `${base}&${terms}&${keywords}`;
}

function onFetchStart() {
  $("#loading").addClass("active");
}

function onFetchEnd() {
  $("#loading").removeClass("active");
}

function renderPreview(record) {
  // grab description, primaryimageurl, and title from the record
  const { description, primaryimageurl, title } = record;

  const element = $(`<div class="object-preview">
<a href="#">
${
  primaryimageurl && title
    ? `<img src="${primaryimageurl}"/> <h3>${title}</h3>`
    : title
    ? `<h3>${title}</h3>`
    : description
    ? `<h3>${description}</h3>`
    : `<img src='${primaryimageurl}'/>`
}
</a >
</div>`);
  element.data("record", record);
  return element;
  /*
  <div class="object-preview">
    <a href="#">
      <img src="image url" />
      <h3>Record Title</h3>
      <h3>Description</h3>
    </a>
  </div>

  Some of the items might be undefined, if so... don't render them

  With the record attached as data, with key 'record'
  */

  // return new element
}

function updatePreview(records, info) {
  const pView = $("#preview");
  console.log(info);
  if (info.next) {
    pView.find(".next").data("url", info.next).attr("disabled", false);
  } else {
    pView.find(".next").data("url", null).attr("disabled", true);
  }

  if (info.prev) {
    pView.find(".previous").data("url", info.prev).attr("disabled", false);
  } else {
    pView.find(".previous").data("url", null).attr("disabled", true);
  }

  // grab the results element, it matches .results inside root
  const resultSearch = pView.find(".results");

  resultSearch.empty();

  records.forEach((record) => {
    resultSearch.append(renderPreview(record));
  });
  // loop over the records, and append the renderPreview
}

function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

function factHTML(title, content, searchTerm = null) {
  // if content is empty or undefined, return an empty string ''
  if (!content) {
    return "";
  }
  // otherwise, if there is no searchTerm, return the two spans

  if (!searchTerm) {
    return `<span class="title">${title}</span>
          <span class="content">${content}
  </span>
  `;
  }
  // otherwise, return the two spans, with the content wrapped in an anchor tag

  return `<span class="title">${title}</span>
          <span class="content"><a href="${BASE_URL}/object?${KEY}&${searchTerm}=${encodeURI(
    content.split("-").join("|")
  )}">${content}</a>
  </span>
  `;
}
function renderFeature(record) {
  const {
    title,
    dated,
    images,
    primaryimageurl,
    description,
    culture,
    style,
    technique,
    medium,
    dimensions,
    people,
    department,
    division,
    contact,
    creditline,
  } = record;

  // build and return template
  return $(`<div class="object-feature">
 <header>
      <h3>${title}<h3>
      <h4>${dated}</h4>
    </header>
    <section class="facts">
      ${factHTML("Description", description)}
      ${factHTML("Culture", culture, "culture")}
      ${factHTML("Style", style)}
      ${factHTML("Technique", technique, "technique")}
      ${factHTML("Medium", medium ? medium.toLowerCase() : null, "medium")}
      ${factHTML("Dimensions", dimensions)}
      ${
        people
          ? people
              .map((person) => factHTML("Person", person.displayname, "person"))
              .join("")
          : ""
      }
      ${factHTML("Department", department)}
      ${factHTML("Division", division)}
      ${factHTML(
        "Contact",
        `<a target="_blank" href="mailto:${contact}">${contact}</a>`
      )}
      ${factHTML("Credit", creditline)}
    </section>
    <section class="photos">
      ${photosHTML(images, primaryimageurl)}
    </section>
  </div>`);
}

function photosHTML(images, primaryimageurl) {
  // if images.length > 0, map the images to the correct image tags, then join them into a single string.  the images have a property called baseimageurl, use that as the value for src
  if (images.length > 0) {
    return images
      .map((image) => `<img src="${image.baseimageurl}" />`)
      .join("");
  } else if (primaryimageurl) {
    return `<img src=${primaryimageurl}" />`;
  } else {
    return "";
  }
}
// else if primaryimageurl is defined, return a single image tag with that as value for src
// else we have nothing, so return the empty string

$("#search").on("submit", async function (event) {
  event.preventDefault();
  onFetchStart();
  try {
    const response = await fetch(buildSearchString());
    console.log(response);
    const { records, info } = await response.json();
    console.log(records, info);
    updatePreview(records, info);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});

$("#preview .next, #preview .previous").on("click", async function () {
  onFetchStart();
  try {
    const url = $(this).data("url");
    const response = await fetch(url);
    const { records, info } = await response.json();

    updatePreview(records, info);
  } catch {
    console.error(error);
  } finally {
    onFetchEnd();
  }
  //  fetch the url
  //  read the records and info from the response.json()
  // update the preview
});

$("#preview").on("click", ".object-preview", function (event) {
  event.preventDefault(); // they're anchor tags, so don't follow the link
  $(".object-preview").closest();
  // find the '.object-preview' element by using .closest() from the target
  const record = $(this).data("record");
  const elementFeature = $("#feature");
  elementFeature.html(renderFeature(record));
  // recover the record from the element using the .data('record') we attached
  console.log(record);
  // log out the record object to see the shape of the data
});
$("#feature").on("click", "a", async function (event) {
  const href = $(this).attr("href");

  if (href.startsWith("mailto:")) {
    return;
  }

  event.preventDefault();

  onFetchStart();
  try {
    let result = await fetch(href);
    let { records, info } = await result.json();
    updatePreview(records, info);
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
});
// fetchAllCenturies();
// fetchObjects().then((x) => console.log(x));
prefetchCategoryLists();
