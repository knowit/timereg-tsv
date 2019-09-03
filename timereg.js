// Global vars are used in this script because it simplifies debugging.
// Note that there is unlikely to ever be global name collisions due
// to Timereg going into deprecation.

window.saveAsTSV = () => {
  window.rows = [];

  // Find all timeliste rows
  $('table#timeliste_rader tr.timeliste_rad')
    // Filter rows that don't have a UBW reference
    .filter((i, value) => {
      const ubwReference = $(value).find('td.referanse_cell input').val();
      if (ubwReference && ubwReference.length !== 0) {
        return true;
      }
      const project = $(value).find('td.prosjekt_cell input').eq(1).val();
      const description = $(value).find('td.beskrivelse_cell input').val();
      console.warn(`project "${project} - ${description}" does not have a UBW reference`);
      return false;
    })
    // Turn each row into a tab separated string
    .each((i, value) => {
      let row = [];
      const ubwReference = $(value).find('td.referanse_cell input').val()
      const ubwCode = ubwReference.split(' ')[0];
      let ubwActivity = '-';
      if (ubwReference.match(/\((.*)\)/) !== null) ubwActivity = ubwReference.match(/\((.*)\)/)[1];
      row.push(ubwCode);
      row.push(ubwActivity);
      row.push($(value).find('td.beskrivelse_cell input').val());
      $(value).find('td.time_value_cell').each((i, cell) => {
        if (cell.style.display !== 'none') {
          row.push($(cell).find('input').val());
        }
      });
      window.rows.push(row.join('\t'));
    });

  // Post processing
  window.rows = window.rows
    // Trim lines
    .map(line => line.trim())
    // Convert numbers from using commas to using periods
    .map(line => {
      const matcher = /\t(\d+),(\d)(\t|$)/g;
      const replacer = '\t$1.$2$3';
      // Replace twice because the first pass may miss one substring that was part of another matched substring
      // TODO: Better regex to prevent double run
      return line.replace(matcher, replacer).replace(matcher, replacer);
    })
    // Comment empty lines
    .map(line => {
      if (line.search(/\t\d+(,|\.)\d$/) === -1) return ';' + line;
      return line;
    })
    // Turn 8 vacation hours into 1 vacation day
    .map(line => {
      if (line.startsWith('ABSENCE') && line.includes('Ferie')) {
        line = line.replace(/8.0/g, '1'); // Vacation days must be used entirely and therefore must be 8.0
      }
      return line;
    });

  // Convert to tab separated values
  window.tsv = window.rows.join('\n');

  // Convert to TSV file
  const data = new Blob([window.tsv], {type: 'text/tab-separated-values'});
  const objectUrl = window.URL.createObjectURL(data);

  // Download TSV file
  const link = document.createElement('a');
  link.download = "Timereg.tsv";
  link.href = objectUrl;
  link.click();
}

document.onreadystatechange = function () {
  if (document.readyState == "complete") {
    // Create button
    window.button = document.createElement('button');
    window.button.id = 'timereg_tsv';
    window.button.innerText = '💾 Last ned som TSV';
    window.button.type = 'button';
    // Add button on the row above the table and the row below the table
    $('button[name="save_and_close_timeliste"]').each((i, val) => {
      const clone = window.button.cloneNode(true);
      clone.onclick = window.saveAsTSV;
      $(val).after(clone);
    })
  }
}

console.log('"Timereg TSV" loaded - TSV download buttons added');
