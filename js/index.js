const SEPERATOR = "~~;~~"

//This has to be done because toronto waste uses html entities for some bizarre reason. I tried to find a better way to unescape HTML entities in JS, could not find it.
//Thank you to CMS on Stackoverflow for this method. original thread: https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
let htmlDecode = (input) => {
    var e = document.createElement('div');
    e.innerHTML = input;
    // handle case of empty input
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

let getHtmlFromJson = (jsonData) => {
    let html = '';
    for (let elem of jsonData) {
        html += '<div class="entry">'
        html += `<i class="fas fa-star ${(isInFavourites(elem.title))?"favourite":"notfavourite"}"></i>`;
        html += `<p>${elem.title}</p>`;

        /*sometimes, the elem.body contains more than one HTML tag, which makes it very hard to format and show the result. 
        The 20 lines of code are handling this situation. 
        Normally, it looks like the ul tag is the only thing that needs to be kept*/
        
        //create an element to determine how many HTML tag
        let e = document.createElement('div');
        let descHtml = htmlDecode(elem.body); 
        e.innerHTML = descHtml;

        //If there is only one child, there is no problem, just leave it be.
        if (e.childNodes.length==1) {
            html += descHtml;
        }
        else {
            let found = false;

            for (let elem of e.childNodes) {
                if (elem.nodeName=="UL") {
                    html += elem.outerHTML;
                    found = true;
                } //if
            }//for

            //when there are no ul tag, replace the p tag with an ul tag, and replace all the \n with a new li tag.
            if (!found) {
                let newDescHtml = `<ul><li>${descHtml.replace("\n","</li><li>")}</li></ul>`
                html+=newDescHtml;
            }
        }//else if
        html += "</div>"
    }
    return html;
    
}

let getFavourites = () => {
    if (localStorage.favourites)
        return localStorage.favourites.split(SEPERATOR);
    else
        return null;
}

let isInFavourites = (title) => {
    if (localStorage.favourites) {
        return getFavourites().filter((val)=>val.indexOf(title)!=-1).length!=0;
    }
    else
        return false;
}

let loadFavourites = () => {
    let allFavs = getFavourites();
    let html = '';
    if (allFavs) {
                               
        
    $.get("https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=1000").done((data)=>{
        let results = [];
        for (let fav of allFavs) {
            for (let elem of data) {
                if (elem.title==fav)
                    results[results.length]=elem;
            }
        }
        html = getHtmlFromJson(results);
        

        $("#favourites").html(html);
        $("#favourites i").on('click',toggleFavouriteFromFavList);
    }).fail((err)=>{

    })
    
    }//if
    else {
        $("#favourites").html('');
    }
}//loadFavourites

let toggleFavouriteFromFavList = (ev) => {
    let $elem = $(ev.target);
    let title = $elem.next().text();

    
    
    let allFavs = getFavourites();
    let index = allFavs.findIndex((val)=>val.indexOf(title)!=-1);
    if (index == 0) {
        allFavs.shift();
        localStorage.favourites = allFavs.join(SEPERATOR);
    }
    else {
        allFavs.splice(index,1);
        localStorage.favourites = allFavs.join(SEPERATOR);
    }
    $("#results > .entry > p").filter((ind,elem)=>elem.innerText==title).prev().removeClass("favourite").addClass("notfavourite");
    
    loadFavourites();
}

let toggleFavourite = (ev) => {
    let $elem = $(ev.target);
    let title = $elem.next().text();

    
    if (isInFavourites(title)) {
        let allFavs = getFavourites();
        let index = allFavs.findIndex((val)=>val.indexOf(title)!=-1);
        if (index == 0) {
            allFavs.shift();
            localStorage.favourites = allFavs.join(SEPERATOR);
        }
        else {
            allFavs.splice(index,1);
            localStorage.favourites = allFavs.join(SEPERATOR);
        }
        $elem.removeClass("favourite").addClass("notfavourite");
    } else {
        $elem.addClass("favourite").removeClass("notfavourite");
        if (localStorage.favourites) {
            localStorage.favourites += SEPERATOR + title
        } else {
            localStorage.favourites = title
        }
    }
    loadFavourites();
}

let sendRequest = () => {
    let search = $('#searchBox').val();
    $.get("https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=1000").done((data)=>{
        let results = [];
        for (let elem of data) {
            if ((elem.title.indexOf(search) != -1)||(elem.keywords.indexOf(search) != -1))
                results[results.length]=elem;
        }
        let html = getHtmlFromJson(results);
        

        $("#results").html(html);
        $(".entry > i").on("click",toggleFavourite);
    }).fail((err)=>{

    })
}

$(()=>{
    loadFavourites();
    $('#searchBtn').on('click',sendRequest);
    $('#searchBox').on('keydown',(ev)=>{
        if (ev.which==13)
            sendRequest();
    })
})