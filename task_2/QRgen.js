$(() => {
  let refNum;
  let names = [];
  let users = JSON.parse(localStorage.getItem("USER")) || [];
  const bankNames = [
    "Chase",
    "BankofAmerica",
    "WellsFargo",
    "Citibank",
    "USBank",
    "PNCBank",
    "GoldmanSachsBank",
    "TruistBank",
    "CapitalOne",
    "TDBank",
  ];

  //name autocomplete
  (function () {
    users = JSON.parse(localStorage.getItem("USER")) || [];
    if (users && users.length > 0) {
      names = users.map((user) => user.name);

      $("#nameInput").autocomplete({
        source: names,
        minLength: 0,
        select: function (event, ui) {},
        focus: function (event, ui) {},
      });
    }
  })();

  //VPA autocomplete
  function vpaAutocomplete(ID) {
    $(ID).autocomplete({
      source: function (request, response) {
        const enteredText = request.term;
        if (enteredText.indexOf("@") !== -1) {
          const enteredBankName = request.term.substring(
            request.term.indexOf("@") + 1
          );

          const filteredNames = bankNames.filter((name) =>
            name.toLowerCase().includes(enteredBankName.toLowerCase())
          );

          if (filteredNames.length > 0) {
            response(
              filteredNames.concat(
                bankNames.filter(
                  (name) => name.toLowerCase() !== enteredBankName.toLowerCase()
                )
              )
            );
          } else {
            bankNames.push(enteredBankName);
            response([]);
          }
        } else {
          response([]);
        }
      },
      minLength: 0,
      select: function (event, ui) {
        const selectedValue = ui.item.value;
        const currentVal = $(this).val();
        const atIndex = currentVal.indexOf("@");
        const vpaBeforeAt = currentVal.substring(0, atIndex + 1);
        ui.item.value = vpaBeforeAt + selectedValue;
      },
      focus: function (event, ui) {
        event.preventDefault();
      },
    });
  }

  //keyup event handler
  $("#vpaInput").on("keyup", function () {
    vpaAutocomplete("#vpaInput");
  });
  $(".newVpa").on("keyup", function () {
    vpaAutocomplete(".newVpa");
  });

  $("#addMore").on("click", function (e) {
    e.preventDefault();
    $(".addMoreSec").toggle("200", function () {
      // console.log("Toggle Animation complete");
    });
  });

  //for generating reference number
  $(".refBtn").on("click", () => {
    let date = new Date();
    refNum =
      String(date.getFullYear()) +
      String(date.getMonth()).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0") +
      String(Math.floor(Math.random() * 10000));

    $(".refInput").val(refNum);
    console.log(refNum);
  });

  $(".close").on("click", () => {
    $("#myModal").hide();
    $("#listModal").hide();
  });

  $(".fa-list").on("click", () => {
    $("#listModal").css("display", "block");
    $("#addUser").hide();
     $(".error-message").text("");
    renderUserList();
  });

  // QR Code generating on submit event
  $("#QRgenerator_form").on("submit", (e) => {
    e.preventDefault();

    const name = $("#nameInput").val().trim();
    const vpa = $("#vpaInput").val().trim();

    let isValid = true;

    $("#nameError").text("");
    $("#vpaError").text("");

    if (!name) {
      isValid = false;
      $("#nameError").text("Name is required!!!");
      $("#nameInput").focus();
    }

    if (!vpa || !vpa.match(/^([^\s@]+)@([^\s@]+)$/)) {
      isValid = false;
      $("#vpaError").text("Invalid VPA format (e.g., name/number@bankname)!!!");
      $("#vpaInput").focus();
    }
    if (isValid) {
      $("#qr_container").html("");
      $("#myModal").css("display", "block");

      var qr_data = "tbe://pay?";
      qr_data += "pn=" + $("#nameInput").val() + "&pa=" + $("#vpaInput").val();

      let note = $("#noteInput").val().trim();

      if (note) {
        qr_data += "&tn=" + note;
      }

      let amount = $("#amountInput").val();
      if (amount) {
        qr_data += "&am=" + amount;
      }

      if (refNum) {
        qr_data += "&tr=" + refNum;
      }

      const qrcode = new QRCode(document.getElementById("qr_container"), {
        text: qr_data,
        width: 200,
        height: 200,
        clearZone: true,
        colorDark: "#000000",
        colorLight: "#ffffff",
        logo: {
          src: "./logo.png",
          width: 100,
          height: 100,
          margin: 4,
        },
      });

      if ($("#remember").is(":checked")) {
        let name = $("#nameInput").val();
        let vpa = $("#vpaInput").val();

        let user = {
          id: Math.floor(Math.random() * 1000),
          name,
          vpa,
        };
        if (!users.length > 0) {
          users.push(user);
          localStorage.setItem("USER", JSON.stringify(users));
        } else {
          let userExists = users.filter((u) => u.vpa == vpa && u.name == name);
          if (!userExists.length > 0) {
            users.push(user);
            localStorage.setItem("USER", JSON.stringify(users));
          }
        }
      }

      //download function on click event
      $("#download-btn").click(() => {
        const img = $("#qr_container").find("img");
        const filename = "qr-code.png";
        download(img.attr("src"), filename, "image/png");
      });

      // Print function on click event
      $("#print-btn").click(function () {
        const imgDataUrl = $("#qr_container").find("img").attr("src");

        const printWindow = window.open("", "_blank");

        const printContent = `<!DOCTYPE html><html><head><title>Print QR Code</title> <style>
            @media print {
                #print-img {
                display: block; 
                margin: auto; 
               margin-top:25%;
               }
              }
         </style>
         </head><body><img  src="${imgDataUrl}" alt="QR Code" id="print-img" style="width: 70%; height: 50%; ">
         </body></html>`;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(function () {
          printWindow.print();
          printWindow.close();
        }, 50);
      });

      $("#QRgenerator_form").trigger("reset");
    }
  });

$(".fa-trash").on("click", () => {
  handleClearUsers();
});

$(".fa-user-plus").on("click", () => {
  $("#addUser").show();
});

$("#addUser").on("submit", (e) => {
  e.preventDefault();
  $(".error-message").text("");
  $(".error-message").show();

  const name = $(".newName").val();
  const vpa = $(".newVpa").val();

  let isValid = true;
  if (!vpa || !vpa.match(/^([^\s@]+)@([^\s@]+)$/)) {
    isValid = false;
    $(".newVpa").focus();
    $(".error-message").text("Invalid VPA format (e.g., name/number@bankname)");
  } else if (!name) {
    isValid = false;
    $(".newName").focus();
    $(".error-message").text("Name is required");
  }

  const existingUser = users.find(
    (user) => user.vpa.toLowerCase() === vpa.toLowerCase()
  );
  if (existingUser) {
    isValid = false;
    $(".error-message").text("User with this VPA already exists!");
    $(".newVpa").focus();
  } else {
    if (isValid) {
      users = JSON.parse(localStorage.getItem("USER")) || [];
      const newUser = {
        id: Math.floor(Math.random() * 1000),
        name,
        vpa,
      };
      users.push(newUser);
      localStorage.setItem("USER", JSON.stringify(users));
      renderUserList();

      $("#addUser").trigger("reset");
      $(".error-message").text("");
      $(".error-message").hide();
      $("#addUser").hide();
      renderUserList();
    } else {
      e.stopPropagation();
    }
  }
});

});

function renderUserList() {
  const userListModal = $("#listContent");
  userListModal.empty();

  let users = JSON.parse(localStorage.getItem("USER")) || [];

  if (!users.length) {
    $("#listContent").css({ border: "none", textAlign: "center" });
    userListModal.html(`<h2 style="color:gray">No users found!</h2>`);
  }
  
  
  users.forEach((user) => {
    let isEditing = false;
    const userEntry = $("<div>").addClass("user-entry");

    const userName = $("<p>").text(user.name);
    userName.attr("contenteditable", "false");
    userEntry.append(userName);

    const userEmail = $("<p>").text(user.vpa);
    userEmail.attr("contenteditable", "false");
    userEntry.append(userEmail);

    const editIcon = $('<i class="fa-solid fa-pen-to-square"></i>');
    editIcon.on("click", () => {
      isEditing = !isEditing;
      if (isEditing) {
        userEntry.addClass("editing");
      }
      if (!isEditing) {
        userEntry.removeClass("editing");
      }
      userName.attr("contenteditable", isEditing);
      userEmail.attr("contenteditable", isEditing);

      userName.on("blur", () => {
        const updatedName = userName.text();
        const updatedIndex = users.findIndex((u) => u.id === user.id);

        if (updatedIndex !== -1) {
          users[updatedIndex].name = updatedName;
        }

        localStorage.setItem("USER", JSON.stringify(users));
        renderUserList();
      });

      userEmail.on("blur", () => {
        const updatedEmail = userEmail.text();
        const updatedIndex = users.findIndex((u) => u.id === user.id);

        if (updatedIndex !== -1) {
          users[updatedIndex].vpa = updatedEmail;
        }

        localStorage.setItem("USER", JSON.stringify(users));
        renderUserList();
      });
    });
    userEntry.append(editIcon);

    const deleteIcon = $('<i class="fa-solid fa-xmark"></i>');
    deleteIcon.on("click", () => {
      handleDeleteUser(user.id);
    });
    deleteIcon.addClass("deleteUser");
    userEntry.append(deleteIcon);

    userListModal.append(userEntry);
  });
  
}

function handleClearUsers() {
  localStorage.removeItem("USER");
  renderUserList();
}

function handleDeleteUser(id) {
  const users = JSON.parse(localStorage.getItem("USER")) || [];
  const filteredUsers = users.filter((u) => u.id !== id);

  localStorage.setItem("USER", JSON.stringify(filteredUsers));
  renderUserList();
}

