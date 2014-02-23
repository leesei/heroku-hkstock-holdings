// http://www.mymessedupmind.co.uk/index.php/javascript-k-mean-algorithm

function kmeans( arrayToProcess, Clusters )
{

  var Groups = new Array();
  var Centroids = new Array();
  var oldCentroids = new Array();
  var changed = false;

  // order the input array
  arrayToProcess.sort(function(a,b){return a - b})

  // initialise group arrays
  for( initGroups=0; initGroups < Clusters; initGroups++ )
  {
    Groups[initGroups] = new Array();
  }

  // pick initial centroids

  initialCentroids=Math.round( arrayToProcess.length/(Clusters+1) );

  for( i=0; i<Clusters; i++ )
  {
    Centroids[i]=arrayToProcess[ (initialCentroids*(i+1)) ];
  }

  do
  {
    for( j=0; j<Clusters; j++ )
    {
      Groups[j] = [];
    }

    changed=false;
    Groups.assignment = [];

    for( i=0; i<arrayToProcess.length; i++ )
    {
      Distance=-1;
      oldDistance=-1

      for( j=0; j<Clusters; j++ )
      {
        distance = Math.abs( Centroids[j]-arrayToProcess[i] );

        if ( oldDistance==-1 )
        {
           oldDistance = distance;
           newGroup = j;
        }
        else if ( distance <= oldDistance )
        {
            newGroup=j;
            oldDistance = distance;
        }
      }
      Groups[newGroup].push( arrayToProcess[i] );
      Groups.assignment[i] = newGroup;
    }

    oldCentroids=Centroids;

    for ( j=0; j<Clusters; j++ )
    {
      total=0;
      newCentroid=0;

      for( i=0; i<Groups[j].length; i++ )
      {
        total+=Groups[j][i];
      }

      newCentroid=total/Groups[newGroup].length;
      Centroids[j]=newCentroid;

    }

    for( j=0; j<Clusters; j++ )
    {
      if ( Centroids[j]!=oldCentroids[j] )
      {
        changed=true;
      }
    }
  }
  while( changed==true );

  return Groups;
}

if (typeof module !== "undefined") {
    module.exports = kmeans;
}
